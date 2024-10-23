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
  const formattedDate = date
    ? new Date(date)
        .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
        .replace(' ', 'T')
        .slice(0, 16)
    : new Date()
        .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
        .replace(' ', 'T')
        .slice(0, 16);

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
    date: formattedDate,
  });

  return waterNote;
};

export const updateWaterNoteService = async (
  waterNoteId,
  amount,
  userId,
  date,
) => {
  const formattedDate = date
    ? new Date(date)
        .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
        .replace(' ', 'T')
        .slice(0, 16)
    : new Date()
        .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
        .replace(' ', 'T')
        .slice(0, 16);

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
      date: formattedDate,
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

export const getUserWaterConsumptionForToday = async (userId) => {
  const currentDate = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Kyiv',
  });

  const waterNotes = await WaterCollection.find({
    owner: userId,
    date: { $regex: `^${currentDate}` },
  });

  const totalAmount = waterNotes.reduce((sum, note) => sum + note.amount, 0);

  const dailyNorm = waterNotes.length > 0 ? waterNotes[0].dailyNorm : 0;

  return {
    totalAmount,
    dailyNorm,
    notes: waterNotes,
  };
};
