import createHttpError from "http-errors";
import { waterRateSchema } from "../validation/waters.js";
import WaterCollection from "../db/models/Waters.js";

export const updateWaterRate = async (req, res, next) => {
    try {

        const { error } = waterRateSchema.validate(req.body);
        if (error) {
            return next(createHttpError(400, `Validation error: ${error.details[0].message}`));
        }

        const { dailyNorm } = req.body;
        const userId = req.user._id;

        const formattedDate = new Date().toISOString().slice(0, 16);

        const updatedWater = await WaterCollection.findOneAndUpdate(
            { owner: userId },
            { dailyNorm, date: formattedDate },
            { new: true, runValidators: true }
        );

        if (!updatedWater) {
            const newWaterEntry = await WaterCollection.create({
            owner: userId,
                dailyNorm,
                amount: 0,
            date: formattedDate,
            });
            return res.status(201).json({
            message: "Daily water norm created successfully",
            data: newWaterEntry,
            });
        }

        return res.status(200).json({
            message: "Daily water norm updated successfully",
            data: updatedWater,
        });
               
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createHttpError(400, 'Invalid user ID format'));
        }
        return next(createHttpError(500, error.message || "Something went wrong"));
    }
};