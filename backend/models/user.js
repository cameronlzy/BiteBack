const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('config');
const validator = require('validator');
const passwordComplexity = require('joi-password-complexity');

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
  username: { type: String, minlength: 3, required: true, unique: true },
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
  }
});

userSchema.methods.generateAuthToken = function() { 
  const token = jwt.sign({
     _id: this._id, username: this.username, email: this.email, role: this.role
  }, config.get('jwtPrivateKey'));
  return token;
}

const userJoiSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: passwordComplexity().required(),
});

const User = mongoose.model('User', userSchema);

exports.User = User; 
exports.userJoiSchema = userJoiSchema;