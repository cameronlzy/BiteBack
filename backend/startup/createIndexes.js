import mongoose from 'mongoose';
import User from '../models/user.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import OwnerProfile from '../models/ownerProfile.model.js';
import Review from '../models/review.model.js';
import Restaurant from '../models/restaurant.model.js';
import Reservation from '../models/reservation.model.js';
import ReviewBadgeVote from '../models/reviewBadgeVote.model.js';
import config from 'config';

async function createAllIndexes() {
  try {
    await mongoose.connect(config.get('mongoURI'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
    });

    console.log('Connected to MongoDB');

    // Create indexes for each model
    await User.createIndexes();
    console.log('User indexes created');

    await CustomerProfile.createIndexes();
    console.log('CustomerProfile indexes created');

    await OwnerProfile.createIndexes();
    console.log('OwnerProfile indexes created');

    await Review.createIndexes();
    console.log('Review indexes created');

    await Restaurant.createIndexes();
    console.log('Restaurant indexes created');

    await Reservation.createIndexes();
    console.log('Reservation indexes created');

    await ReviewBadgeVote.createIndexes();
    console.log('ReviewBadgeVote indexes created');

    console.log('All indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAllIndexes();
