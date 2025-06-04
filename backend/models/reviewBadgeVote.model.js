const mongoose = require('mongoose');

const reviewBadgeVoteSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  badgeIndex: { type: Number, required: true, min: 0, max: 3 },
  createdAt: { type: Date, default: Date.now }
});

reviewBadgeVoteSchema.index({ customer: 1, review: 1 }, { unique: true });

const ReviewBadgeVote = mongoose.model('ReviewBadgeVote', reviewBadgeVoteSchema);

module.exports = ReviewBadgeVote;