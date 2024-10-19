import Joi from 'joi';
import { emailRegexp } from '../constants/users.js';

export const userRegisterloginSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(8).required(64),
});
