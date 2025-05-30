const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

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

module.exports = { validateRestaurant, restaurantJoiSchema };