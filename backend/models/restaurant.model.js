import mongoose from 'mongoose';
import validator from 'validator';

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

const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: { type: String, minLength: 2, maxLength: 255, required: true },
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
  openingHours: { type: String, required: true },
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
  images: {
    type: [String],
    default: [],
  },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },
  tags: { 
    type: [String],
    validate: [
      {
        validator: function (arr) {
        return arr.every(tag => tagList.includes(tag));
      },
        message: 'One or more cuisines are invalid.'
      }
    ], default: [],
   }, 
  searchKeywords: [String],
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  queueEnabled: { type: Boolean, default: true },
  timezone: { type: String, required: true, default: 'Asia/Singapore' }
}, { versionKey: false });

restaurantSchema.pre('save', function (next) {
  const nameTokens = this.name.toLowerCase().split(' ');
  const tagTokens = (this.tags || []).map(tag => tag.toLowerCase());
  const cuisineTokens = (this.cuisines || []).map(c => c.toLowerCase());

  this.searchKeywords = [...nameTokens, ...tagTokens, ...cuisineTokens];
  next();
});

function handleSearchKeywordsUpdate() {
  return async function (next) {
    const update = this.getUpdate();
    if (!update) return next();

    const isSet = !!update.$set;
    const updatedFields = isSet ? update.$set : update;

    // If any of name, tags, cuisines are updated, recompute keywords
    const fieldsToUpdate = ['name', 'tags', 'cuisines'];
    const isUpdating = fieldsToUpdate.some(f => Object.prototype.hasOwnProperty.call(updatedFields, f));

    if (!isUpdating) return next();

    // get current doc
    const docToUpdate = await this.model.findOne(this.getQuery()).lean();

    const nameTokens = updatedFields.name
      ? updatedFields.name.toLowerCase().split(' ')
      : docToUpdate?.name.toLowerCase().split(' ') || [];

    const tagTokens = updatedFields.tags
      ? updatedFields.tags.map(t => t.toLowerCase())
      : (docToUpdate?.tags || []).map(t => t.toLowerCase());

    const cuisineTokens = updatedFields.cuisines
      ? updatedFields.cuisines.map(c => c.toLowerCase())
      : (docToUpdate?.cuisines || []).map(c => c.toLowerCase());

    const searchKeywords = [...nameTokens, ...tagTokens, ...cuisineTokens];

    if (isSet) {
      update.$set.searchKeywords = searchKeywords;
    } else {
      update.searchKeywords = searchKeywords;
    }

    next();
  };
}

restaurantSchema.pre('findOneAndUpdate', handleSearchKeywordsUpdate());
restaurantSchema.pre('updateOne', handleSearchKeywordsUpdate());
restaurantSchema.pre('updateMany', handleSearchKeywordsUpdate());

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ searchKeywords: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;