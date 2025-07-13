import Joi from 'joi';

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
  'Fast Food',
];

const tagList = [
  // Features
  "Free Wi-Fi",
  "Outdoor Seating",
  "Live Music",
  "Pet Friendly",
  "Wheelchair Accessible",

  // Dietary
  "Vegan Options",
  "Gluten-Free Available",
  "Halal Certified",
  "Low Carb",
  "Nut-Free"
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
  }),
  tags: Joi.array().items(Joi.string().valid(...tagList)).required(),
});

export function validateRestaurant(restaurant) {
  return restaurantJoiSchema.validate(restaurant);
}

export function validateRestaurantBulk(restaurants) {
  const schema = Joi.object({
    restaurants: Joi.array().items(restaurantJoiSchema).required(),
  });
  return schema.validate(restaurants);
}

export function validatePatch(update) {
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
    }),
    tags: Joi.array().items(Joi.string().valid(...tagList)),
  }).min(1);
  return schema.validate(update);
}

export function validateImages(images) {
  const schema = Joi.object({
    images: Joi.array().items(Joi.string().uri()).required()
  });
  return schema.validate(images);
}

export function validateDiscover(filters) {
  const schema = Joi.object({
    cuisines: Joi.array().items(Joi.string().valid(...cuisineList)),
    tags: Joi.array().items(Joi.string().valid(...tagList)),
    minRating: Joi.number().min(0).max(5).precision(1),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }),
    radius: Joi.number().integer().min(1),
    openNow: Joi.boolean(),
  })
  .min(1)
  .with('location', 'radius')
  .with('radius', 'location');
  return schema.validate(filters);
}

export function validateSearch(filters) {
  const schema = Joi.object({
    search: Joi.string().min(1).empty('').default(null),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(8),
    sortBy: Joi.string().valid('averageRating', 'name', 'reviewCount').default('averageRating'),
    order: Joi.string().valid('desc', 'asc').default('desc'),
  });
  return schema.validate(filters);
}

export function validateEventQuery(query) {
  const schema = Joi.object({
    event: Joi.boolean()
  });
  return schema.validate(query);
}
