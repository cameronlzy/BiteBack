import mongoose from 'mongoose';

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

dailyAnalyticsSchema.index({ restaurant: 1 });
dailyAnalyticsSchema.index({ date: 1 });
dailyAnalyticsSchema.index({ restaurant: 1, date: 1 }, { unique: true });

const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);

export default DailyAnalytics;