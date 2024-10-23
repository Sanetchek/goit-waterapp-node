import Joi from 'joi';
import { emailRegexp } from '../constants/users.js';

export const userRegisterSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(8).required(64),
});

export const userloginSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(8).required(64),
});

export const userWaterSchema = Joi.object({
  dailyNormWater: Joi.number().min(1).max(15000).required(),
});

export const sendResetEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string().required(),
});
