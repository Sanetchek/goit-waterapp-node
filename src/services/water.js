import Users from '../db/models/Users.js';
import WaterCollection from '../db/models/Waters.js';
import createHttpError from 'http-errors';

export const getUserWaterRate = (filter) => {
  return Users.findOne(filter);
};

export const updateUserWaterRate = async (filter, data, options = {}) => {
  const updatedUser = await Users.findOneAndUpdate(filter, data, {
    includeResultMetadata: true,
    ...options,
  });

  if (!updatedUser) {
    return null;
  }

  return updatedUser;
};

export const updateWaterRateService = async (userId, dailyNorm) => {
  const currentDate = new Date();
  const formattedDate = currentDate
    .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
    .replace(' ', 'T')
    .slice(0, 16);

  const updatedWater = await WaterCollection.findOneAndUpdate(
    { owner: userId },
    {
      dailyNorm,
      date: formattedDate,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedWater) {
    const newWaterEntry = await WaterCollection.create({
      owner: userId,
      dailyNorm,
      amount: 0,
      date: formattedDate,
    });
    return { message: 'created', data: newWaterEntry };
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
  const formattedDate = date
    ? new Date(date)
        .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
        .replace(' ', 'T')
        .slice(0, 16)
    : new Date()
        .toLocaleString('sv-SE', { timeZone: 'Europe/Kyiv' })
        .replace(' ', 'T')
        .slice(0, 16);

  /*  const waterNote = await WaterCollection.findOne({
    owner: userId,
    date: formattedDate,
  });

  if (waterNote) {
    waterNote.amount += amount;
    await waterNote.save();
    console.log(waterNote);

    return waterNote;
  } else {
    const newWaterNote = await WaterCollection.create({
      owner: userId,
      amount,
      date: formattedDate,
    });
    return newWaterNote;
  } */

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

export const getTodayWaterConsumptionService = async (userId) => {
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

  console.log(waterNotes);

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
