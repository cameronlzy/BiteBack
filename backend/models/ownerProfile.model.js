const mongoose = require('mongoose');

const ownerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, minlength: 2, required: true },
  companyName: { type: String, required: true },
  restaurants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length > 0;
      },
      message: 'At least one restaurant is required.'
    },
    required: true
  }
},{
  timestamps: { createdAt: 'dateJoined', updatedAt: false }, 
  versionKey: false
});

const OwnerProfile = mongoose.model('OwnerProfile', ownerProfileSchema);

module.exports = OwnerProfile;
