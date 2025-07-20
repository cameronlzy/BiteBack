import Restaurant from '../models/restaurant.model.js';
import Reservation from '../models/reservation.model.js';
import User from '../models/user.model.js';
import OwnerProfile from '../models/ownerProfile.model.js';
import Review from '../models/review.model.js';
import ReviewBadgeVote from '../models/reviewBadgeVote.model.js';
import Promotion from '../models/promotion.model.js';
import Event from '../models/event.model.js';
import Staff from '../models/staff.model.js';
import VisitHistory from '../models/visitHistory.model.js';
import QueueCounter from '../models/queueCounter.model.js';
import QueueEntry from '../models/queueEntry.model.js';
import RewardPoint from '../models/rewardPoint.model.js';
import RewardItem from '../models/rewardItem.model.js';
import DailyAnalytics from '../models/dailyAnalytics.model.js';
import MenuItem from '../models/menuItem.model.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import * as reservationService from '../services/reservation.service.js';
import { createSlots, convertOpeningHoursToUTC, filterOpenRestaurants } from '../helpers/restaurant.helper.js';
import { generateStaffUsername, generateStaffHashedPassword } from '../helpers/staff.helper.js';
import { getCurrentTimeSlotStartUTC } from '../helpers/restaurant.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';
import _ from 'lodash';
import { deleteImagesFromCloudinary, deleteImagesFromDocument } from './image.service.js';
import { geocodeAddress } from '../helpers/geocode.js';
import { escapeRegex } from '../helpers/regex.helper.js';
import { error, success } from '../helpers/response.js';

export async function searchRestaurants(filters) {
  const { search, page, limit, sortBy, order } = filters;

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
    const searchStage = search ? regexMatchStage : null;
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
  return success({
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    restaurants
  });
}

export async function discoverRestaurants(filters) {
  const {
    cuisines,
    minRating,
    location,
    radius,
    openNow,
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
  if (minRating) {
    pipeline.push({
      $match: {
        averageRating: { $gte: minRating }
      }
    });
  }

  // sort by distance ascending
  if (location) pipeline.push({ $sort: { distance: 1 } });

  // set limit
  pipeline.push({ $limit: 20 });

  // fetch matching restaurants
  let restaurants = await Restaurant.aggregate(pipeline);
  // filter open now
  if (openNow) restaurants = filterOpenRestaurants(restaurants);

  return success(restaurants);
}

export async function getRestaurantById(restaurantId) { 
  // find restaurant
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) return error(404, 'Restaurant not found');
  return success(restaurant);
}

export async function getAvailability(restaurantId, query) {
  // find restaurant
  const restaurant = await Restaurant.findById(restaurantId).select('_id timezone openingHours slotDuration maxCapacity').lean();
  if (!restaurant) return error(404, 'Restaurant not found');

  // create time slots
  const date = DateTime.fromISO(query.date, { zone: restaurant.timezone });
  const timeSlots = createSlots(restaurant.openingHours, date);
  if (Array.isArray(timeSlots) && timeSlots.length === 0) return success([]);

  const dayStart = date.startOf('day').toUTC().toJSDate();
  const dayEnd = date.endOf('day').toUTC().toJSDate();

  // get reservations and events on query date
  const [reservations, overlappingEvents] = await Promise.all([
    reservationService.getReservationsByRestaurantByDate(restaurant, query.date),
    Event.find({ restaurant: restaurant._id, startDate: { $lt: dayEnd }, endDate: { $gt: dayStart } }).select('slotPax startDate endDate').lean(),
  ]);

  const availabilityMap = {};
  timeSlots.forEach(slot => availabilityMap[slot] = restaurant.maxCapacity);

  reservations.forEach(({ startDate, endDate, pax, event }) => {
    if (event) return;

    const start = DateTime.fromJSDate(startDate);
    const end = DateTime.fromJSDate(endDate);

    for (let dt = start; dt < end; dt = dt.plus({ minutes: restaurant.slotDuration })) {
      const slotTime = dt.toFormat('HH:mm');
      if (availabilityMap[slotTime] !== undefined) {
        availabilityMap[slotTime] -= pax;
      }
    }
  });

  overlappingEvents.forEach(event => {
    const eventStart = DateTime.fromJSDate(event.startDate);
    const eventEnd = DateTime.fromJSDate(event.endDate);

    timeSlots.forEach(slot => {
      const slotDT = DateTime.fromFormat(slot, 'HH:mm', { zone: 'utc' })
        .set({ year: date.year, month: date.month, day: date.day });

      if (slotDT >= eventStart && slotDT < eventEnd) {
        availabilityMap[slot] -= event.slotPax;
      }
    });
  });

  return success(timeSlots.map(slot => ({
    time: slot,
    available: Math.max(0, availabilityMap[slot])
  })));
}

export async function getVisitCount(authUser, restaurant) {
  const result = await VisitHistory.aggregate([
    {
      $match: {
        customer: new mongoose.Types.ObjectId(authUser.profile),
        restaurant: new mongoose.Types.ObjectId(restaurant),
      }
    },
    {
      $project: {
        visitCount: { $size: '$visits' }
      }
    }
  ]);

  const visitCount = result[0]?.visitCount ?? 0;
  return success({ visitCount });
}

export async function getReservationsByRestaurant(restaurant, query) {
    const timeSlotStartUTC = getCurrentTimeSlotStartUTC(restaurant);
    if (!timeSlotStartUTC) return success([]);

    const baseFilter = {
        restaurant: restaurant._id,
        startDate: { $lt: timeSlotStartUTC.plus({ minutes: restaurant.slotDuration }).toJSDate() },
        endDate: { $gt: timeSlotStartUTC.toJSDate() }
    };

    if (query.event === 'true') {
        baseFilter.event = { $ne: undefined };
    }

    const reservations = await Reservation.find(baseFilter)
        .populate('customer', 'name contactNumber')
        .populate('event', '_id title')
        .lean();

    return success(reservations);
}

export async function createRestaurant(authUser, data) {
  return await withTransaction(async (session) => {
    const restaurant = await createRestaurantHelper(authUser, data, session);

    // update owner
    const user = await User.findById(authUser._id).populate('profile').session(session);
    if (!user) return error(404, 'User not found');
    if (!user.profile) return error(404, 'Owner Profile not found');

    // commit transaction
    user.profile.restaurants.push(restaurant._id);
    await user.profile.save(wrapSession(session));

    return success(restaurant.toObject());
  });
}

export async function createRestaurantBulk(authUser, data) {
  return await withTransaction(async (session) => {
    // update owner
    const user = await User.findById(authUser._id).populate('profile').session(session);
    if (!user) return error(404, 'User not found');
    if (!user.profile) return error(404, 'Owner Profile not found');

      // create restaurants
    const restaurantIds = [];
    for (const item of data) {
      const restaurant = await createRestaurantHelper(authUser, item, session);
      restaurantIds.push(restaurant._id);
    }

    user.profile.restaurants = restaurantIds;
    await user.profile.save(wrapSession(session));

    return success(restaurantIds);
  });
}

export async function updateRestaurantImages(restaurant, newImageUrls) {
  const currentImage = restaurant.images || [];

  // find images to delete
  const toDelete = currentImage.filter(url => !newImageUrls.includes(url));

  // delete removed images
  if (toDelete.length > 0) {
    await deleteImagesFromCloudinary(toDelete);
  }
  
  // overwrite old array with new array
  restaurant.images = newImageUrls;
  await restaurant.save();

  return success(restaurant.toObject().images);
}

export async function updateRestaurant(restaurant, update) {
  // selectively update only the fields that are defined
  for (const key in update) {
    if (key === 'openingHours') {
      restaurant.openingHours = convertOpeningHoursToUTC(update.openingHours);
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
  return success(restaurant.toObject());
}

export async function togglePreorders(restaurant, data) {
  restaurant.preordersEnabled = data.preordersEnabled;
  await restaurant.save();
  return success(data);
}

export async function deleteRestaurant(restaurant, authUser) {
  return await withTransaction(async (session) => {
    // get ownerProfile 
    const user = await User.findById(authUser._id).session(session).lean();
    if (!user) return error(404, 'User not found');
    if (!user.profile) return error(404, 'Owner Profile not found');
    
    // updating owner profile
    const profile = await OwnerProfile.findByIdAndUpdate(user.profile,
        { $pull: { restaurants: restaurant._id }}, { runValidators: true }
    ).session(session);
    if (!profile) return error(404, 'Owner Profile not found');

    await deleteRestaurantAndAssociations(restaurant, session);

    return success(restaurant);
  });
}

// helper services
export async function createRestaurantHelper(authUser, data, session = undefined) {
  // get longitude and latitude
  const fullAddress = data.address.replace(/S(\d{6})$/i, 'Singapore $1');
  const { longitude, latitude } = await geocodeAddress(fullAddress);

  // create restaurant
  const restaurant = new Restaurant(_.pick(data, ['name', 'address', 'contactNumber', 'cuisines', 'maxCapacity', 'email', 'website', 'tags']));
  restaurant.location = { type: 'Point', coordinates: [longitude, latitude] };
  restaurant.owner = authUser.profile;
  restaurant.openingHours = convertOpeningHoursToUTC(data.openingHours);

  // create staff account for restaurant
  const staff = await createStaffForRestaurant(restaurant, session);
  restaurant.staff = staff._id;

  await restaurant.save(wrapSession(session));
  return restaurant;
}

export async function createStaffForRestaurant(restaurant, session = undefined) {
  const username = generateStaffUsername(restaurant.name);
  const { hashedPassword, encryptedPassword } = await generateStaffHashedPassword();

  const staff = new Staff({
    username, password: hashedPassword,
    encryptedPassword, restaurant: restaurant._id, role: 'staff'
  });
  
  await staff.save(wrapSession(session));
  return staff;
}

export async function deleteRestaurantAndAssociations(restaurant, session = undefined) {
  // delete images
  await deleteImagesFromDocument(restaurant, 'images');
  
  // delete associations
  const models = [
    Reservation,
    Review,
    ReviewBadgeVote,
    Staff,
    Promotion,
    Event,
    DailyAnalytics,
    QueueCounter,
    QueueEntry,
    RewardPoint,
    RewardItem,
    VisitHistory,
    MenuItem,
  ];

  await Promise.all(
    models.map((Model) =>
      Model.deleteMany({ restaurant: restaurant._id }).session(session)
    )
  );

  // delete restaurant after children deleted
  await Restaurant.findByIdAndDelete(restaurant._id).session(session);
}