const Joi = require('joi');

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

const openingHoursRegex =
  /^(x|([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d)(\|(x|([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d)){6}$/;

const openingHoursSchema = Joi.string()
  .pattern(openingHoursRegex)
  .custom((value, helpers) => {
    const segments = value.split('|');

    for (const segment of segments) {
      if (segment === 'x') continue;

      const [start, end] = segment.split('-');
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes >= endMinutes) {
        return helpers.error('any.invalid');
      }
    }

    return value;
  }, 'Start time must be before end time');


const restaurantJoiSchema = Joi.object({
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
  openingHours: openingHoursSchema.required(),
  maxCapacity: Joi.number().integer().min(0).max(1000).required(),
  email: Joi.string().email().optional(),
  website: Joi.string().uri().optional().messages({
    "string.uri": "Invalid website URL",
  })
});

function validateRestaurant(restaurant) {
  return restaurantJoiSchema.validate(restaurant);
}

function validateRestaurantBulk(restaurants) {
  const schema = Joi.object({
    restaurants: Joi.array().items(restaurantJoiSchema).required(),
  });
  return schema.validate(restaurants);
}

function validatePatch(update) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(20),
    address: Joi.string().min(2).max(255),
    contactNumber: Joi.string()
      .pattern(/^\d{8}$/)
      .messages({
      "string.pattern.base": "Contact number must be an 8-digit number.",
      "string.empty": `"contactNumber" is required`
    }),
    cuisines: Joi.array().items(Joi.string().valid(...cuisineList)).min(1),
    openingHours: openingHoursSchema,
    maxCapacity: Joi.number().integer().min(0).max(1000),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional().messages({
      "string.uri": "Invalid website URL",
    })
  }).min(1);
  return schema.validate(update);
}

function validateImages(images) {
  const schema = Joi.object({
    images: Joi.array().items(Joi.string().uri()).required()
  });
  return schema.validate(images);
}

module.exports = { 
  validateRestaurant,
  validateRestaurantBulk,
  restaurantJoiSchema, 
  validatePatch,
  validateImages,
};