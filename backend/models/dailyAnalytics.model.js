import mongoose from 'mongoose';
import { getRedisClient } from '../startup/redisClient.js';
import logger from '../startup/logging.js';
import { DateTime } from 'luxon';

const DAYS_TO_CHECK = [1, 7, 30, 180];

const dailyAnalyticsSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  totalVisits: { type: Number, default: 0 },
  visitLoadByHour: {
    startHour: { type: Number, required: true }, 
    load: {
      type: [Number],
      required: true,
      default: []
    }
  },
  reservations: {
    total: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    noShowRate: { type: Number, default: 0 }, // 0.0-1.0 fraction
    averagePax: { type: Number, default: 0 }
  },
  reviews: {
    count: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingMode: { type: Number } // 1–5
  },
  queue: {
    total: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    abandonmentRate: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0 },
    byQueueGroup: {
      small: {
        total: { type: Number, default: 0 },
        attended: { type: Number, default: 0 },
      },
      medium: {
        total: { type: Number, default: 0 },
        attended: { type: Number, default: 0 },
      },
      large: {
        total: { type: Number, default: 0 },
        attended: { type: Number, default: 0 },
      }
    },
  },
}, { versionKey: false });

async function clearCacheForRestaurant(restaurantId, daysArray) {
  const redisClient = await getRedisClient();

  for (const days of daysArray) {
    const cacheKey = `analytics:trends:${restaurantId}:days:${days}`;
    await redisClient.del(cacheKey);
  }
}

dailyAnalyticsSchema.pre('save', function (next) {
  this._wasNew = this.isNew;
  next();
});

dailyAnalyticsSchema.post('save', async function (doc) {
  try {
    const now = DateTime.now().startOf('day');
    const maxDays = Math.max(...DAYS_TO_CHECK);
    const cutoff = now.minus({ days: maxDays });

    const isRecent = DateTime.fromJSDate(doc.date).startOf('day') >= cutoff;

    if (doc._wasNew || isRecent) {
      await clearCacheForRestaurant(doc.restaurant, DAYS_TO_CHECK);
    }
  } catch (err) {
    logger.error('Redis cache clearing failed in DailyAnalytics post-save hook', {
      error: err,
      restaurantId: doc.restaurant?.toString(),
      analyticsDate: doc.date?.toISOString(),
    });
    console.error(err);
  }
});

dailyAnalyticsSchema.index({ restaurant: 1 });
dailyAnalyticsSchema.index({ date: 1 });
dailyAnalyticsSchema.index({ restaurant: 1, date: 1 }, { unique: true });

const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);

export default DailyAnalytics;