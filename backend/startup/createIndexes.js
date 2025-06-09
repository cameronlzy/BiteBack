const mongoose = require('mongoose');

const User = require('../models/user.model');
const CustomerProfile = require('../models/customerProfile.model');
const OwnerProfile = require('../models/ownerProfile.model');
const Review = require('../models/review.model');
const Restaurant = require('../models/restaurant.model');
const Reservation = require('../models/reservation.model');
const ReviewBadgeVote = require('../models/reviewBadgeVote.model');
const config = require('config');

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
