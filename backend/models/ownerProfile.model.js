const mongoose = require('mongoose');

const ownerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, minlength: 2, required: true },
  companyName: { type: String, required: true },
  restaurants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    default: [],
  }
},{
  timestamps: { createdAt: 'dateJoined', updatedAt: false }, 
  versionKey: false
});

const OwnerProfile = mongoose.model('OwnerProfile', ownerProfileSchema);

module.exports = OwnerProfile;
