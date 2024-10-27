import UsersCollection from '../db/models/Users.js';
import WaterCollection from '../db/models/Waters.js';
import createHttpError from 'http-errors';

export const getUserWaterRate = (filter) => {
  return UsersCollection.findOne(filter);
};

export const updateUserWaterRate = async (filter, data, options = {}) => {
  const updatedUser = await UsersCollection.findOneAndUpdate(filter, data, {
    includeResultMetadata: true,
    ...options,
  });

  if (!updatedUser) {
    return null;
  }

  return updatedUser;
};

export const updateWaterRateService = async (userId, dailyNormWater) => {
  const updatedWater = await UsersCollection.findOneAndUpdate(
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
  const user = await UsersCollection.findById(userId); // Use UsersCollection here
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

export const getMonthlyWaterConsumptionService = async (
  userId,
  year,
  month,
) => {
  // Set start and end dates for the specified month
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 1).toISOString().split('T')[0];

  // Calculate total number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Query the database for the user's water consumption notes within the month
  const waterNotes = await WaterCollection.find({
    owner: userId,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  // Return an empty array if there are no records for the month
  if (waterNotes.length === 0) {
    return {
      daysInMonth,
      monthlyData: []
    };
  }

  // Assume all notes have the same dailyNorm for the month
  const dailyNorm = waterNotes[0].dailyNorm;

  // Group water notes by day
  const groupedNotes = waterNotes.reduce((acc, note) => {
    const noteDate = note.date.split('T')[0]; // Use ISO date format directly

    // Initialize the date entry if it doesn't exist
    if (!acc[noteDate]) {
      acc[noteDate] = {
        totalAmount: 0,
        consumptionCount: 0,
      };
    }

    // Accumulate total amount and increment count for the date
    acc[noteDate].totalAmount += note.amount;
    acc[noteDate].consumptionCount += 1;

    return acc;
  }, {});

  // Create an array of formatted data for each day of the month
  const monthlyData = Object.keys(groupedNotes).map((noteDate) => {
    const {
      totalAmount,
      consumptionCount
    } = groupedNotes[noteDate];

    // Calculate consumption percentage, limited to 100%
    const percentage = Math.min(
      ((totalAmount / dailyNorm) * 100).toFixed(2),
      100,
    ).toString();

    // Format the date as "day, month"
    const noteDateObj = new Date(noteDate);
    const day = noteDateObj.getDate();
    const monthName = noteDateObj.toLocaleString('en-US', {
      month: 'long'
    });
    const formattedDate = `${day}, ${monthName}`;

    return {
      date: formattedDate,
      day,
      month: monthName,
      dailyNorm: `${dailyNorm}`,
      percentage: `${percentage}`,
      consumptionCount: consumptionCount,
    };
  });

  return {
    daysInMonth,
    monthlyData
  };
};
