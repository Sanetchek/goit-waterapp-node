import {
  updateWaterRateService,
  addWaterNoteService,
  updateWaterNoteService,
  deleteWaterNoteService,
  getTodayWaterConsumptionService,
  getMonthlyWaterConsumptionService,
} from '../services/water.js';

export const updateWaterRate = async (req, res) => {
  const { dailyNormWater } = req.body;
  const userId = req.user._id;

  const waterRate = await updateWaterRateService(userId, dailyNormWater);

  return res.status(200).json({
    message: 'Daily water norm updated successfully',
    data: waterRate.data,
  });
};

export const addWaterNote = async (req, res) => {
  const { amount, date, dailyNorm } = req.body;
  const owner = req.user._id;

  const waterNote = await addWaterNoteService(owner, amount, date, dailyNorm);

  return res.status(201).json({
    message: 'Water consumption note added successfully',
    data: waterNote,
  });
};

export const updateWaterNote = async (req, res) => {
  const { waterNoteId } = req.params;
  const { amount, date } = req.body;
  const userId = req.user._id;

  const updatedWaterNote = await updateWaterNoteService(
    waterNoteId,
    amount,
    userId,
    date,
  );

  return res.status(200).json({
    message: 'Water note updated successfully',
    data: updatedWaterNote,
  });
};

export const deleteWaterNote = async (req, res) => {
  const { waterNoteId } = req.params;
  const userId = req.user._id;

  await deleteWaterNoteService(waterNoteId, userId);

  return res.status(200).json({
    message: 'Water note deleted successfully',
  });
};

export const getTodayWaterConsumption = async (req, res) => {
  const userId = req.user._id;

  const { totalAmount, dailyNorm, notes } =
    await getTodayWaterConsumptionService(userId);

  const percentage = dailyNorm
    ? ((totalAmount / dailyNorm) * 100).toFixed(2)
    : 0;

  return res.status(200).json({
    message: "Today's water consumption data",
    data: {
      percentage,
      totalAmount,
      dailyNorm,
      notes,
    },
  });
};

export const getMonthlyWaterConsumption = async (req, res) => {
  const userId = req.user._id;
  const { year, month } = req.params;

  const monthlyData = await getMonthlyWaterConsumptionService(
    userId,
    year,
    month,
  );

  return res.status(200).json({
    message: 'Monthly water consumption data',
    data: monthlyData,
  });
};
