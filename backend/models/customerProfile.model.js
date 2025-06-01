const mongoose = require('mongoose');

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

const customerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
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
  favCuisines: {
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
  points: { type: Number, required: true, default: 0 },
  totalBadges: {
    type: [Number],
    required: true,
    validate: {
      validator: function (arr) {
        return (
          Array.isArray(arr) &&
          arr.length === 4 &&
          arr.every(num => Number.isInteger(num) && num >= 0)
        );
      },
      message: 'totalBadges must be an array of 4 non-negative integers.'
    }, default: [0, 0, 0, 0]
  }
}, {
  timestamps: { createdAt: 'dateJoined', updatedAt: false }, 
  versionKey: false
});

customerProfileSchema.path('dateJoined').immutable(true);

const CustomerProfile = mongoose.model('CustomerProfile', customerProfileSchema);

module.exports = CustomerProfile;
