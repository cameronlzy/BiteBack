const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email'
    }
  },
  username: { type: String, minlength: 2, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'owner'], required: true },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'roleProfile',
    required: true,
  },
  roleProfile: {
    type: String,
    enum: ['CustomerProfile', 'OwnerProfile'],
    required: true,
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { versionKey: false });

const User = mongoose.model('User', userSchema);

module.exports = User; 