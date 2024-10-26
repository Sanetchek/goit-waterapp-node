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
  const startDate = new Date(year, month - 1, 1).toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Kyiv',
  });
  const endDate = new Date(year, month, 1).toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Kyiv',
  });

  const waterNotes = await WaterCollection.find({
    owner: userId,
    date: { $gte: startDate, $lt: endDate },
  });

  if (waterNotes.length === 0) {
    return [];
  }

  const dailyNorm = waterNotes[0].dailyNorm;

  const groupedNotes = waterNotes.reduce((acc, note) => {
    const noteDate = new Date(note.date).toLocaleDateString('sv-SE', {
      timeZone: 'Europe/Kyiv',
    });

    if (!acc[noteDate]) {
      acc[noteDate] = { totalAmount: 0, consumptionCount: 0 };
    }

    acc[noteDate].totalAmount += note.amount;
    acc[noteDate].consumptionCount += 1;

    return acc;
  }, {});

  const monthlyData = Object.keys(groupedNotes).map((noteDate) => {
    const { totalAmount, consumptionCount } = groupedNotes[noteDate];
    const percentage = Math.min(
      ((totalAmount / dailyNorm) * 100).toFixed(2),
      100,
    ).toString();

    const noteDateObj = new Date(noteDate);
    const day = noteDateObj.getDate();
    const month = noteDateObj.toLocaleString('en-US', { month: 'long' });
    const formattedDate = `${day}, ${month}`;

    return {
      date: formattedDate,
      dailyNorm: `${dailyNorm}`,
      percentage: `${percentage}`,
      consumptionCount: consumptionCount,
    };
  });

  return monthlyData;
};
