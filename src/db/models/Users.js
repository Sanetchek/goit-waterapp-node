import { Schema, model } from 'mongoose';
import { handleSaveError, setUpdateOptions } from './hooks.js';
import { emailRegexp } from '../../constants/users.js';

const userSchema = new Schema(
  {
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      unique: true,
      match: emailRegexp,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['woman', 'man'],
      default: 'woman',
    },
    weight: {
      type: Number,
      default: 0,
    },
    sportTime: {
      type: Number,
      default: 0,
    },
    dailyNormWater: {
      type: Number,
      default: 1500,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

userSchema.post('save', handleSaveError);
userSchema.pre('findOneAndUpdate', setUpdateOptions);
userSchema.post('findOneAndUpdate', handleSaveError);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const UserCollection = model('user', userSchema);

export default UserCollection;
