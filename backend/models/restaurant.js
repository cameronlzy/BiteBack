const mongoose = require('mongoose');
const validator = require('validator');
const Joi = require('joi');

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
  email: {
    type: String,
    required: true,
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
    }),
    email: Joi.string().email({ tlds: { allow: false } }).optional(),
    website: Joi.string().uri().optional().messages({
      "string.uri": "Invalid website URL",
    })
  });

function validateRestaurant(profile) {
  return restaurantJoiSchema.validate(profile);
}

async function createRestaurantArray(arr) {
  try {
    let output = [];
    for (const item of arr) {
      validateRestaurant(item);
      restaurant = new Restaurant(item);
      await restaurant.save();
      output.push(new Restaurant(item));
    }
    return output;
  } catch (err) {
    throw err;
  }
}

exports.Restaurant = Restaurant;
exports.validateRestaurant = validateRestaurant;
exports.restaurantSchema = restaurantSchema;
exports.restaurantJoiSchema = restaurantJoiSchema;
exports.createRestaurantArray = createRestaurantArray;