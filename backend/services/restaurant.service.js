const Restaurant = require('../models/restaurant.model');
const Reservation = require('../models/reservation.model');
const User = require('../models/user.model');
const OwnerProfile = require('../models/ownerProfile.model');
const { validateRestaurant } = require('../validators/restaurant.validator');
const { DateTime } = require('luxon');
const reservationService = require('../services/reservation.service');
const { createSlots, convertSGTOpeningHoursToUTC } = require('../helpers/restaurant.helper');
const _ = require('lodash');
const mongoose = require('mongoose');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.getAllRestaurants = async () => {
  // find restaurants
  const restaurants = await Restaurant.find().sort('name').lean();
  return { status: 200, body: restaurants };
}

exports.getRestaurantById = async (restaurantId) => { 
  // find restaurant
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) throw { status: 404, message: 'Restaurant not found.' };
  return { status: 200, body: restaurant };
};

exports.getAvailability = async (restaurantId, query) => {
  // find restaurant
  const restaurant = await Restaurant.findById(restaurantId).select('+_id').lean();
  if (!restaurant) throw { status: 404, message: 'Restaurant not found.' };

  // get reservations on query date
  const reservations = await reservationService.getReservationsByRestaurantByDate(restaurant._id, query.date);

  // create time slots
  const SGTdate = DateTime.fromISO(query.date, { zone: 'Asia/Singapore' });
  const timeSlots = createSlots(restaurant.openingHours, SGTdate);
  if (Array.isArray(timeSlots) && timeSlots.length === 0) return { status: 200, body: -1 };

  // calculate availability for each slot
  const availabilityMap = {};
  timeSlots.forEach(slot => availabilityMap[slot] = restaurant.maxCapacity);
  reservations.forEach(({ reservationDate, pax }) => {
    const slotTime = DateTime.fromJSDate(reservationDate).toUTC().toFormat('HH:mm');
    if (availabilityMap[slotTime]) availabilityMap[slotTime] -= pax;
  });

  return { status: 200, body: timeSlots.map(slot => ({
    time: slot,
    available: Math.max(0, availabilityMap[slot])
  })) };
};

exports.createRestaurant = async (authUser, data) => {
  const session = isProdEnv ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    // create restaurant
    const restaurant = new Restaurant(_.pick(data, ['name', 'address', 'contactNumber', 'cuisines', 'maxCapacity', 'email', 'website']));
    restaurant.owner = authUser._id;
    restaurant.openingHours = convertSGTOpeningHoursToUTC(data.openingHours);
    await restaurant.save({ session });

    // update owner
    const user = await User.findById(authUser._id).populate('profile').session(session || null);
    if (!user) throw { status: 404, body: 'User not found' };
    if (!user.profile) throw { status: 404, body: 'Owner Profile not found' };

    // commit transaction
    user.profile.restaurants.push(restaurant._id);
    await user.profile.save({ session });

    if (session) await session.commitTransaction();

    return { status: 200, body: restaurant.toObject() };
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

exports.updateRestaurant = async (restaurant, update) => {
  // update restaurant
  Object.assign(restaurant, update);
  restaurant.openingHours = convertSGTOpeningHoursToUTC(update.openingHours);
  await restaurant.save();
  return { status: 200, body: restaurant.toObject() };
};

exports.deleteRestaurant = async (restaurant, authUser) => {
  const session = isProdEnv ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    // get ownerProfile 
    const user = await User.findById(authUser._id).session(session || null).lean();
    if (!user) throw { status: 404, body: 'User not found.' };
    if (!user.profile) throw { status: 404, body: 'Owner Profile not found.' };
    
    // updating owner profile
    const profile = await OwnerProfile.findByIdAndUpdate(user.profile,
        { $pull: { restaurants: restaurant._id }}, { session, runValidators: true }
    );
    if (!profile) throw { status: 404, body: 'Owner Profile not found.' };

    // delete reservations from restaurant
    await Reservation.deleteMany({ restaurant: restaurant._id }).session(session || null);

    // delete restaurant
    await Restaurant.deleteOne({ _id: restaurant._id }).session(session || null);

    // commit transaction
    if (session) await session.commitTransaction();

    return { status: 200, body: restaurant };
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

exports.createRestaurantArray = async (arr, userId, session = null) => {
  let restaurant;
  try {
    let output = [];
    for (let item of arr) {
      validateRestaurant(item);
      item.owner = userId;
      item.openingHours = convertSGTOpeningHoursToUTC(item.openingHours);
      restaurant = new Restaurant(item);
      if (session) {
        await restaurant.save({ session });
      } else {
        await restaurant.save();
      }
      output.push(restaurant._id);
    }
    return output;
  } catch (err) {
    throw err;
  }
}