import Users from "../db/models/Users.js";
import WaterCollection from "../db/models/Waters.js";
import createHttpError from "http-errors";

export const getUserWaterRate = (filter) => {
    return Users.findOne(filter);
};

export const updateUserWaterRate = async (filter, data, options = {}) => {
    const updatedUser = await Users.findOneAndUpdate(filter, data, {
        includeResultMetadata: true, ...options,
    });

    if (!updatedUser) {
        return null;
    }

    return updatedUser;
};

export const updateWaterRateService = async (userId, dailyNorm) => {
    const currentDate = new Date();
    const formattedDate = currentDate
        .toLocaleString("sv-SE", { timeZone: "Europe/Kyiv" })
        .replace(" ", "T")
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
        }
    );

    if (!updatedWater) {
        const newWaterEntry = await WaterCollection.create({
            owner: userId,
            dailyNorm,
            amount: 0,
            date: formattedDate,
        });
        return { message: "created", data: newWaterEntry };
    }

    return { message: "updated", data: updatedWater };
};

export const addWaterNoteService = async (userId, waterVolume, date, dailyNorm) => {
    const formattedDate = date
        ? new Date(date).toLocaleString("sv-SE", { timeZone: "Europe/Kyiv" }).replace(" ", "T").slice(0, 16)
        : new Date().toLocaleString("sv-SE", { timeZone: "Europe/Kyiv" }).replace(" ", "T").slice(0, 16);

    let userWaterRate = await WaterCollection.findOne({ owner: userId });
    
    if (dailyNorm) {
        userWaterRate = await WaterCollection.findOneAndUpdate(
            { owner: userId },
            { dailyNorm },
            { new: true, runValidators: true }
        );
    }

    const waterNote = await WaterCollection.create({
        owner: userId,
        amount: waterVolume,
        dailyNorm: userWaterRate ? userWaterRate.dailyNorm : dailyNorm || 0,
        date: formattedDate,
    });

    return waterNote;
};

export const updateWaterNoteService = async (waterNoteId, waterVolume, userId) => {
    const currentDate = new Date();
    const formattedDate = currentDate
        .toLocaleString("sv-SE", { timeZone: "Europe/Kyiv" })
        .replace(" ", "T")
        .slice(0, 16);
    
    const waterNote = await WaterCollection.findOne({ _id: waterNoteId, owner: userId });
    if (!waterNote) {
        throw createHttpError(404, "Water note not found or access denied");
    }

    const updatedWaterNote = await WaterCollection.findByIdAndUpdate(
        waterNoteId,
        {
            amount: waterVolume,
            date: formattedDate,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    return updatedWaterNote;
};

export const deleteWaterNoteService = async (waterNoteId, userId) => {
    const waterNote = await WaterCollection.findOne({ _id: waterNoteId, owner: userId });
    if (!waterNote) {
        throw createHttpError(404, "Water note not found or access denied");
    }

    const deletedWaterNote = await WaterCollection.findByIdAndDelete(waterNoteId);

    if (!deletedWaterNote) {
        throw createHttpError(404, "Water note not found");
    }

    return deletedWaterNote;
};