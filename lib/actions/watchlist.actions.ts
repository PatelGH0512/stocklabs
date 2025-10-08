'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { Alert } from '@/database/models/alert.model';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlist(userId: string) {
  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }).lean();
    return items;
  } catch (err) {
    console.error('getWatchlist error:', err);
    return [];
  }
}

export async function addToWatchlist(userId: string, symbol: string, company: string) {
  try {
    await connectToDatabase();
    const item = await Watchlist.create({
      userId,
      symbol: symbol.toUpperCase(),
      company,
      addedAt: new Date()
    });
    return item;
  } catch (err) {
    console.error('addToWatchlist error:', err);
    throw new Error('Failed to add to watchlist');
  }
}

export async function removeFromWatchlist(userId: string, symbol: string) {
  try {
    await connectToDatabase();
    await Watchlist.deleteOne({ userId, symbol: symbol.toUpperCase() });
    return { success: true };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    throw new Error('Failed to remove from watchlist');
  }
}

// Alert functions
export async function createPriceAlert(
  userId: string, 
  alert: {
    symbol: string;
    company: string;
    type: 'price' | 'change';
    condition: 'above' | 'below';
    value: number;
    frequency?: 'once' | 'hourly' | 'daily' | 'weekly';
  }
) {
  try {
    await connectToDatabase();
    const newAlert = await Alert.create({
      userId,
      symbol: alert.symbol.toUpperCase(),
      company: alert.company,
      type: alert.type,
      condition: alert.condition,
      value: alert.value,
      frequency: alert.frequency || 'daily',
      active: true
    });
    return { success: true, alert: newAlert };
  } catch (err) {
    console.error('createPriceAlert error:', err);
    throw new Error('Failed to create alert');
  }
}

export async function getAlerts(userId: string) {
  try {
    await connectToDatabase();
    const alerts = await Alert.find({ userId, active: true }).lean();
    return alerts;
  } catch (err) {
    console.error('getAlerts error:', err);
    return [];
  }
}

export async function deleteAlert(userId: string, alertId: string) {
  try {
    await connectToDatabase();
    await Alert.deleteOne({ _id: alertId, userId });
    return { success: true };
  } catch (err) {
    console.error('deleteAlert error:', err);
    throw new Error('Failed to delete alert');
  }
}

export async function updateAlert(userId: string, alertId: string, updates: any) {
  try {
    await connectToDatabase();
    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, userId },
      updates,
      { new: true }
    );
    return { success: true, alert };
  } catch (err) {
    console.error('updateAlert error:', err);
    throw new Error('Failed to update alert');
  }
}
