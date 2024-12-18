import UserCollection from '../db/models/Users.js';
import WaterCollection from '../db/models/Waters.js';
import createHttpError from 'http-errors';

export const updateUserWaterRate = async (filter, data, options = {}) => {
  const updatedUser = await UserCollection.findOneAndUpdate(filter, data, {
    includeResultMetadata: true,
    ...options,
  });

  if (!updatedUser) {
    return null;
  }

  return updatedUser;
};

export const updateWaterRateService = async (userId, dailyNormWater) => {
  const updatedWater = await UserCollection.findOneAndUpdate(
    { _id: userId },
    {
      dailyNormWater,
    },
    {
      new: true,
    },
  );

  if (!updatedWater) {
    return { message: 'User not found', data: null };
  }

  return { message: 'updated', data: updatedWater };
};

export const addWaterNoteService = async (userId, amount, date, dailyNorm) => {
  let userWaterRate = await WaterCollection.findOne({ owner: userId });

  if (dailyNorm) {
    userWaterRate = await WaterCollection.findOneAndUpdate(
      { owner: userId },
      { dailyNorm },
      { new: true, runValidators: true },
    );
  }

  const waterNote = await WaterCollection.create({
    owner: userId,
    amount: amount,
    dailyNorm: userWaterRate ? userWaterRate.dailyNorm : dailyNorm || 0,
    date: date,
  });

  return waterNote;
};

export const updateWaterNoteService = async (
  waterNoteId,
  amount,
  userId,
  date,
) => {
  const waterNote = await WaterCollection.findOne({
    _id: waterNoteId,
    owner: userId,
  });
  if (!waterNote) {
    throw createHttpError(404, 'Water note not found or access denied');
  }

  const updatedWaterNote = await WaterCollection.findByIdAndUpdate(
    waterNoteId,
    {
      amount: amount,
      date: date,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return updatedWaterNote;
};

export const deleteWaterNoteService = async (waterNoteId, userId) => {
  const waterNote = await WaterCollection.findOne({
    _id: waterNoteId,
    owner: userId,
  });
  if (!waterNote) {
    throw createHttpError(404, 'Water note not found or access denied');
  }

  const deletedWaterNote = await WaterCollection.findByIdAndDelete(waterNoteId);

  if (!deletedWaterNote) {
    throw createHttpError(404, 'Water note not found');
  }

  return deletedWaterNote;
};

export const getTodayWaterConsumptionService = async (userId) => {
  const currentDate = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Kyiv',
  });

  // Change this line to use the correct collection name
  const user = await UserCollection.findById(userId); // Use UserCollection here
  if (!user) throw createHttpError(401, 'User not found');

  const waterNotes = await WaterCollection.find({
    owner: userId,
    date: {
      $regex: `^${currentDate}`
    },
  });

  const totalAmount = waterNotes.reduce((sum, note) => sum + note.amount, 0);

  return {
    totalAmount,
    dailyNorm: user.dailyNormWater,
    notes: waterNotes,
  };
};

export const getMonthlyWaterConsumptionService = async (userId, year, month) => {
  // Set start and end dates for the specified month in 'YYYY-MM-DD' format
  const startDate = new Date(year, month - 1, 1).toLocaleDateString('en-CA');
  const endDate = new Date(year, month, 1).toLocaleDateString('en-CA');

  // Query the database for the user's water consumption notes within the month
  const waterNotes = await WaterCollection.find({
    owner: userId,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  const user = await UserCollection.findById(userId);

  // Assume all notes have the same dailyNorm for the month if there are records
  let dailyNorm = waterNotes.length > 0 ? waterNotes[0].dailyNorm : 0;

  // Group water notes by day
  const groupedNotes = waterNotes.reduce((acc, note) => {
    const noteDate = note.date.split('T')[0];

    if (!acc[noteDate]) {
      acc[noteDate] = {
        totalAmount: 0,
        consumptionCount: 0,
      };
    }

    acc[noteDate].totalAmount += note.amount;
    acc[noteDate].consumptionCount += 1;
    acc[noteDate].dailyNorm = note.dailyNorm;

    return acc;
  }, {});

  // Create an array of all days in the month, including empty fields for days with no data
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthlyData = Array.from({
    length: daysInMonth
  }, (_, index) => {
    const todaysDate = new Date();
    const currentMonth = todaysDate.getMonth() + 1;
    const todayDay = todaysDate.getDate();
    const day = index + 1; // This gives the correct day (1 to daysInMonth)
    const date = new Date(year, month - 1, day);
    const dateString = date.toLocaleDateString('en-CA'); // Format date to 'YYYY-MM-DD' in local timezone
    const monthName = date.toLocaleString('en-US', {
      month: 'long'
    }); // Get the month name

    // Construct the unique key with the correct day of the month formatted as 'YYYY-MM-DD'
    const uniqueKey = `${userId}-${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (Number(currentMonth) === Number(month) && todayDay === day) {
      const {
        totalAmount,
        consumptionCount
      } = groupedNotes[dateString];
      dailyNorm = user.dailyNormWater;
      const percentage = Math.min(((totalAmount / dailyNorm) * 100).toFixed(2), 100).toString();

      // Return null or default values for days with no data
      return {
        key: uniqueKey, // Add unique key
        date: `${day}, ${monthName}`, // This correctly reflects the current day
        day,
        dailyNorm: `${dailyNorm}`,
        percentage,
        consumptionCount,
      };
    } else if (groupedNotes[dateString]) {
      const {
        totalAmount,
        consumptionCount,
        dailyNorm
      } = groupedNotes[dateString];
      const percentage = Math.min(((totalAmount / dailyNorm) * 100).toFixed(2), 100).toString();

      return {
        key: uniqueKey,
        date: `${day}, ${monthName}`,
        day,
        dailyNorm: `${dailyNorm}`,
        percentage,
        consumptionCount,
      };
    } else {
      return {
        key: uniqueKey,
        date: `${day}, ${monthName}`,
        day,
        dailyNorm: '0',
        percentage: '0',
        consumptionCount: 0,
      };
    }
  });

  return monthlyData;
};

