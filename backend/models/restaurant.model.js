const mongoose = require('mongoose');
const validator = require('validator');

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

const openingHoursSchema = {
  type: String,
  required: true,
  validate: {
    validator: function(value) {
      if (!openingHoursRegex.test(value)) return false;

      const segments = value.split('|');

      for (const segment of segments) {
        if (segment === 'x') continue;

        const [start, end] = segment.split('-');
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (startMinutes >= endMinutes) return false;
      }

      return true;
    },
    message: 'Invalid opening hours format or time ranges.'
  }
};

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
  openingHours: openingHoursSchema,
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
  },
  rating: { type: Number, min: 0, max: 5, required: true, default: 0 }
}, { versionKey: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;