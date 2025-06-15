import mongoose from 'mongoose';

const queueCounterSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  queueGroup: { type: String, enum: ['small', 'medium', 'large'], required: true },
  lastNumber: { type: Number, default: 0 },
  calledNumber: { type: Number, default: 0 }
}, { versionKey: false });

queueCounterSchema.index({ restaurant: 1, queueGroup: 1 }, { unique: true });

const QueueCounter = mongoose.model('QueueCounter', queueCounterSchema);

export default QueueCounter;
