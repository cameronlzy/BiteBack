const mongoose = require('mongoose');
const validator = require('validator');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { DateTime } = require('luxon');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$|^Closed$/;

const dailyTimeSchema = Joi.string()
  .pattern(timePattern)
  .required()
  .custom((value, helpers) => {
    if (value === "Closed") return value;

    const [start, end] = value.split("-");
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    if (startTotal >= endTotal) {
      return helpers.error("any.invalid", { message: "Opening time must be before closing time" });
    }

    return value;
  }, "Opening time check")
  .messages({
    'string.pattern.base': 'Time must be in HH:MM-HH:MM 24-hour format or "Closed"',
    'any.invalid': '{{#message}}',
    'any.required': 'Time is required for each day'
});

const cuisineList = [
  'Chinese',
  'Malay',
  'Indian',
  'Peranakan',
  'Western',
  'Thai',
  'Japanese',
  'Korean',
  'Vietnamese',
  'Indonesian',
  'Filipino',
  'Middle Eastern',
  'Mexican',
  'Italian',
  'French',
  'Hawker',
  'Fusion',
  'Seafood',
  'Vegetarian',
  'Halal'
];

const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: {type: String, minLength: 2, maxLength: 255, required: true },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid 8-digit contact number!`
    }
  },
  cuisines: {
    type: [String],
    required: true,
    validate: [
      {
      validator: function (arr) {
        return arr.length > 0;
      },
      message: 'favouriteCuisines must contain at least one cuisine.'
      },
      {
        validator: function (arr) {
        return arr.every(cuisine => cuisineList.includes(cuisine));
      },
        message: 'One or more cuisines are invalid.'
      }
    ]
  },
  openingHours: { type: Object, required: true },
  maxCapacity: { type: Number, min: 0, max: 1000, required: true },
  slotDuration: { type: Number, min: 0, max: 1440, default: 60 },
  email: {
    type: String,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email'
    }
  },
  website: {
    type: String,
    validate: {
      validator: v => validator.isURL(v, { protocols: ['http', 'https'], require_protocol: true }),
      message: 'Invalid URL'
    }
  }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

let restaurantJoiSchema = Joi.object({
    name: Joi.string().min(2).max(20).required(),
    address: Joi.string().min(2).max(255).required(),
    contactNumber: Joi.string()
      .pattern(/^\d{8}$/)
      .required()
      .messages({
      "string.pattern.base": "Contact number must be an 8-digit number.",
      "string.empty": `"contactNumber" is required`
    }),
    cuisines: Joi.array().items(Joi.string().valid(...cuisineList)).min(1).required(),
    openingHours: Joi.object({
      monday: dailyTimeSchema,
      tuesday: dailyTimeSchema,
      wednesday: dailyTimeSchema,
      thursday: dailyTimeSchema,
      friday: dailyTimeSchema,
      saturday: dailyTimeSchema,
      sunday: dailyTimeSchema
    }).required(),
    maxCapacity: Joi.number().integer().min(0).max(1000).required(),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional().messages({
      "string.uri": "Invalid website URL",
    })
  });

function validateRestaurant(restaurant) {
  return restaurantJoiSchema.validate(restaurant);
}

async function createRestaurantArray(arr, userId, session = null) {
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

function createTestRestaurant(owner) {
  let restaurantName = "restaurant";
  let address = "new york";
  let contactNumber = "87654321";
  let cuisines = ["Chinese"];
  let openingHours = {
    monday: "09:00-17:00",
    tuesday: "09:00-17:00",
    wednesday: "09:00-17:00",
    thursday: "09:00-17:00",
    friday: "09:00-17:00",
    saturday: "10:00-14:00",
    sunday: "Closed"
  };
  openingHours = convertSGTOpeningHoursToUTC(openingHours);
  let restaurantEmail = `restaurant@gmail.com`;
  let website = "https://www.restaurant.com";
  let maxCapacity = 50;
  return new Restaurant({
    owner,
    name: restaurantName,
    address,
    contactNumber,
    cuisines,
    openingHours,
    maxCapacity,
    email: restaurantEmail,
    website
  });
}

function createSlots(restaurant, queryDate) {
  // find day of week and opening hours
  // make sure that it works if it loops over a day
  const dayOfWeek = queryDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const timeRange = restaurant.openingHours[dayOfWeek];
  const slotDuration = restaurant.slotDuration;

  if (!timeRange || timeRange == "Closed") return null;
  const [startTime, endTime] = timeRange.split('-');

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const slots = [];

  const start = new Date();
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  let current = new Date(start);

  while (current < end) {
    const hours = String(current.getHours()).padStart(2, '0');
    const minutes = String(current.getMinutes()).padStart(2, '0');
    current = new Date(current.getTime() + slotDuration * 60000);
    if (current > end) break;
    slots.push(`${hours}:${minutes}`);
  }
  return slots;
}

function convertSGTOpeningHoursToUTC(openingHours) {
  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const result = {};

  for (const day of daysOfWeek) {
    const hours = openingHours[day];

    if (typeof hours === 'string' && hours.toLowerCase() === 'closed') {
      result[day] = 'Closed';
      continue;
    }

    const [start, end] = hours.split('-');

    // using an arbitrary date
    const dateString = '2025-01-01';

    const startUTC = DateTime.fromISO(`${dateString}T${start}`, { zone: 'Asia/Singapore' })
      .toUTC()
      .toFormat('HH:mm');

    const endUTC = DateTime.fromISO(`${dateString}T${end}`, { zone: 'Asia/Singapore' })
      .toUTC()
      .toFormat('HH:mm');

    result[day] = `${startUTC}-${endUTC}`;
  }

  return result;
}

exports.Restaurant = Restaurant;
exports.validateRestaurant = validateRestaurant;
exports.createRestaurantArray = createRestaurantArray;
exports.createTestRestaurant = createTestRestaurant;
exports.createSlots = createSlots;
exports.convertSGTOpeningHoursToUTC = convertSGTOpeningHoursToUTC;