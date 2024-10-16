import { model, Schema } from 'mongoose';
import { handleSaveError, setUpdateOptions } from './hooks.js';

const waterSchema = new Schema(
  {
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

waterSchema.post('save', handleSaveError);
waterSchema.pre('findOneAndUpdate', setUpdateOptions);
waterSchema.post('findOneAndUpdate', handleSaveError);

const WaterCollection = model('water', waterSchema);

export default WaterCollection;
