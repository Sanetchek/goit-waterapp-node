import Joi from "joi";

export const waterRateSchema = Joi.object({
    dailyNorm: Joi.number().min(1).max(15000).required(),     
});

export const waterNotesSchema = Joi.object({
    waterVolume: Joi.number().min(1).max(5000).required(),
    date: Joi.date().iso().required(),
});



