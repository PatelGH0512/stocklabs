import mongoose, { Schema, models, model } from 'mongoose';

export interface IHolding extends mongoose.Document {
  userId: string;
  symbol: string;
  company: string;
  shares: number;
  buyPrice: number;
  currentPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  company: { type: String, required: true },
  shares: { type: Number, required: true, min: 0 },
  buyPrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, default: 0 },
}, { timestamps: true });

HoldingSchema.index({ userId: 1, symbol: 1 }, { unique: false });

export const Holding = (models.Holding as mongoose.Model<IHolding>) || model<IHolding>('Holding', HoldingSchema);
