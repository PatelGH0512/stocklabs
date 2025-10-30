import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  type: 'price' | 'change';
  condition: 'above' | 'below' | 'equal';
  value: number; // targetPrice
  alertName?: string;
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'realtime';
  active: boolean;
  triggered?: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    type: { type: String, enum: ['price', 'change'], default: 'price' },
    condition: { type: String, enum: ['above', 'below', 'equal'], required: true },
    value: { type: Number, required: true },
    alertName: { type: String, trim: true },
    frequency: { type: String, enum: ['once', 'hourly', 'daily', 'weekly', 'realtime'], default: 'daily' },
    active: { type: Boolean, default: true },
    triggered: { type: Boolean, default: false },
    lastTriggered: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient querying
AlertSchema.index({ userId: 1, symbol: 1 });
AlertSchema.index({ active: 1, symbol: 1 });

export const Alert: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) || model<AlertItem>('Alert', AlertSchema);

