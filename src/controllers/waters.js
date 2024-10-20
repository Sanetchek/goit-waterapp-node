import createHttpError from "http-errors";
import { waterRateSchema, waterNotesSchema } from "../validation/waters.js";
import {
    updateWaterRateService,
    addWaterNoteService,
    updateWaterNoteService,
    deleteWaterNoteService,
} from "../services/water.js";

export const updateWaterRate = async (req, res, next) => {
    try {

        const { error } = waterRateSchema.validate(req.body);
        if (error) {
            return next(createHttpError(400, `Validation error: ${error.details[0].message}`));
        }

        const { dailyNorm } = req.body;
        const userId = req.user._id;

         const result = await updateWaterRateService(userId, dailyNorm);

        if (result.message === "created") {
            return res.status(201).json({
                message: "Daily water norm created successfully",
                data: result.data,
            });
        }

        return res.status(200).json({
            message: "Daily water norm updated successfully",
            data: result.data,
        });
    } catch (error) {
        return next(createHttpError(500, error.message || "Something went wrong"));
    }
};

export const addWaterNote = async (req, res, next) => {
    try {
        const { error } = waterNotesSchema.validate(req.body);
        if (error) {
            return next(createHttpError(400, `Validation error: ${error.details[0].message}`));
        }

        const { waterVolume } = req.body;
        const userId = req.user._id;

        const waterNote = await addWaterNoteService(userId, waterVolume);

        return res.status(201).json({
            message: "Water consumption note added successfully",
            data: waterNote,
        });
    } catch (error) {
        return next(createHttpError(500, error.message || "Something went wrong"));
    }
};

export const updateWaterNote = async (req, res, next) => {
    try {
        const { waterNoteId } = req.params;
        const { error } = waterNotesSchema.validate(req.body);
        if (error) {
            return next(createHttpError(400, `Validation error: ${error.details[0].message}`));
        }

        const { waterVolume } = req.body;
        const updatedWaterNote = await updateWaterNoteService(waterNoteId, waterVolume);

        return res.status(200).json({
            message: "Water note updated successfully",
            data: updatedWaterNote,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(createHttpError(400, "Invalid note ID format"));
        }
        return next(createHttpError(500, error.message || "Something went wrong"));
    }
};

export const deleteWaterNote = async (req, res, next) => {
    try {
        const { waterNoteId } = req.params;
        await deleteWaterNoteService(waterNoteId);

        return res.status(200).json({
            message: "Water note deleted successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(createHttpError(400, "Invalid note ID format"));
        }
        return next(createHttpError(500, error.message || "Something went wrong"));
    }
};