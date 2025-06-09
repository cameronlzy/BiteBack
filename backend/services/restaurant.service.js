const Restaurant = require('../models/restaurant.model');
const Reservation = require('../models/reservation.model');
const User = require('../models/user.model');
const OwnerProfile = require('../models/ownerProfile.model');
const Review = require('../models/review.model');
const ReviewBadgeVote = require('../models/reviewBadgeVote.model');
const { DateTime } = require('luxon');
const reservationService = require('../services/reservation.service');
const { createSlots, convertSGTOpeningHoursToUTC, filterOpenRestaurants } = require('../helpers/restaurant.helper');
const _ = require('lodash');
const mongoose = require('mongoose');
const { deleteImagesFromCloudinary, deleteImagesFromDocument } = require('./image.service');
const geocodeAddress = require('../helpers/geocode');
const { escapeRegex } = require('../helpers/regex.helper');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.searchRestaurants = async (filters) => {
  const {
    search,
    page = 1,
    limit = 8,
    sortBy = 'averageRating',
    order = 'desc',
  } = filters;

  const skip = (page - 1) * limit;
  const sortOrder = order === 'desc' ? -1 : 1;
  const basePipeline = [];

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const regexMatchStage = {
      $match: {
        $or: [
          { name: regex },
          { tags: regex },
          { cuisines: regex },
          { searchKeywords: { $elemMatch: { $regex: regex } } }
        ]
      }
    };

  //   const searchStage = search
  //     ? !isProdEnv || regexFallback
  //       ? regexMatchStage
  //       : {
  //         $search: {
  //           index: 'default',
  //           text: {
  //             query: search,
  //             path: ['name', 'tags', 'cuisines', 'searchKeywords'],
  //             fuzzy: {
  //               maxEdits: 1,
  //               prefixLength: 1,
  //             },
  //           },
  //         },
  //       }
  //     : null;
  //   basePipeline.push(searchStage);
  // }

      const searchStage = search
        ? regexMatchStage : null;
    basePipeline.push(searchStage);
  }

  // create pipeline to get totalCount
  const countPipeline = [...basePipeline, { $count: 'total' }];

  // pagination
  basePipeline.push(
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        averageRating: 1,
        reviewCount: 1,
        cuisines: 1,
        tags: 1,
        address: 1,
        images: [{ $arrayElemAt: ["$images", 0] }],
      },
    }
  );

  const [restaurants, countResult] = await Promise.all([
    Restaurant.aggregate(basePipeline),
    Restaurant.aggregate(countPipeline),
  ]);

  const totalCount = countResult[0]?.total || 0;
  return { 
    status: 200, 
    body: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      restaurants
    }
  };
}

exports.discoverRestaurants = async (filters) => {
  const {
    cuisines,
    minRating = 0,
    location,
    radius = 3000,
    openNow = false,
    tags
  } = filters;

  const pipeline = [];

  // filter by location and calculate the distance from user
  if (location) {
    pipeline.push({
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        distanceField: 'distance',
        maxDistance: radius,
        spherical: true
      }
    });
  }

  // filter by cuisines 
  if (cuisines) {
    pipeline.push({
      $match: {
        cuisines: { $in: cuisines }
      }
    });
  }

  // filter by tags
  if (tags) {
    pipeline.push({
      $match: {
        tags: { $in: tags }
      }
    });
  }

  // filter by minimum rating
  pipeline.push({
    $match: {
      averageRating: { $gte: minRating }
    }
  });

  // sort by distance ascending
  if (location) pipeline.push({ $sort: { distance: 1 } });

  // set limit
  pipeline.push({ $limit: 20 });

  // fetch matching restaurants
  let restaurants = await Restaurant.aggregate(pipeline);
  // filter open now
  if (openNow) restaurants = filterOpenRestaurants(restaurants);

  return { status: 200, body: restaurants }
};

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
    const restaurant = await exports.createRestaurantHelper(authUser, data, session);

    // update owner
    const user = await User.findById(authUser._id).populate('profile').session(session || null);
    if (!user) throw { status: 404, body: 'User not found' };
    if (!user.profile) throw { status: 404, body: 'Owner Profile not found' };

    // commit transaction
    user.profile.restaurants.push(restaurant._id);
    await user.profile.save(session ? { session } : undefined);

    if (session) await session.commitTransaction();

    return { status: 200, body: restaurant.toObject() };
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

exports.createRestaurantBulk = async (authUser, data) => {
  const session = isProdEnv ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    // create restaurants
    const restaurantIds = [];
    for (const item of data) {
      const restaurant = await exports.createRestaurantHelper(authUser, item, session);
      restaurantIds.push(restaurant._id);
    }

    // update owner
    const user = await User.findById(authUser._id).populate('profile').session(session || null);
    if (!user) throw { status: 404, body: 'User not found' };
    if (!user.profile) throw { status: 404, body: 'Owner Profile not found' };
    user.profile.restaurants = restaurantIds;
    await user.profile.save(session ? { session } : undefined);

    // commit transaction
    if (session) await session.commitTransaction();

    return { status: 200, body: restaurantIds };
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

exports.updateRestaurantImages = async (restaurant, newImageUrls) => {
  const currentImage = restaurant.images || [];

  // find images to delete
  const toDelete = currentImage.filter(url => !newImageUrls.includes(url));

  // delete removed images
  if (toDelete.length > 0) {
    const result = await deleteImagesFromCloudinary(toDelete);
  }
  

  // overwrite old array with new array
  restaurant.images = newImageUrls;
  await restaurant.save();

  return { status: 200, body: restaurant.toObject().images };
}

exports.updateRestaurant = async (restaurant, update) => {
  // selectively update only the fields that are defined
  for (const key in update) {
    if (key === 'openingHours') {
      restaurant.openingHours = convertSGTOpeningHoursToUTC(update.openingHours);
    } else if (key === 'address') {
      // get longitude and latitude
      const fullAddress = update[key].replace(/S(\d{6})$/i, 'Singapore $1');
      const { longitude, latitude } = await geocodeAddress(fullAddress);
      restaurant.location = { type: 'Point', coordinates: [longitude, latitude] };
      restaurant.address = update[key];
    } else if (update[key] !== undefined) {
      restaurant[key] = update[key];
    }
  }
  
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

    await exports.deleteRestaurantAndAssociations(restaurant, session);

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

// utility services
exports.createRestaurantHelper = async (authUser, data, session = null) => {
  // get longitude and latitude
  const fullAddress = data.address.replace(/S(\d{6})$/i, 'Singapore $1');
  const { longitude, latitude } = await geocodeAddress(fullAddress);

  // create restaurant
  const restaurant = new Restaurant(_.pick(data, ['name', 'address', 'contactNumber', 'cuisines', 'maxCapacity', 'email', 'website', 'tags']));
  restaurant.location = { type: 'Point', coordinates: [longitude, latitude] };
  restaurant.owner = authUser._id;
  restaurant.openingHours = convertSGTOpeningHoursToUTC(data.openingHours);
  await restaurant.save(session ? { session } : undefined);
  return restaurant;
}

exports.deleteRestaurantAndAssociations = async (restaurant, session = null) => {
  // delete images
  await deleteImagesFromDocument(restaurant, 'images');
  
  // delete restaurants and it's associations
  await Promise.all([
    Reservation.deleteMany({ restaurant: restaurant._id }).session(session),
    Review.deleteMany({ restaurant: restaurant._id }).session(session),
    ReviewBadgeVote.deleteMany({ restaurant: restaurant._id }).session(session)
  ]);

  // delete restaurant after children deleted
  await Restaurant.findByIdAndDelete(restaurant._id).session(session);
};