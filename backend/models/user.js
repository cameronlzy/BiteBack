const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('config');
const validator = require('validator');
const passwordComplexity = require('joi-password-complexity');
const bcrypt = require('bcrypt');
const { create } = require('lodash');

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

async function createTestUser(role) {
  const now = Date.now();
  const threeDigit = now % 1000; //
  const paddedDigits = String(threeDigit).padStart(3, '0');
  let email = `myEmail${paddedDigits}@gmail.com`;
  let username = `username${paddedDigits}`;
  let password = "myPassword@123";
  let roleProfile = role == "customer" ? 'CustomerProfile' : 'OwnerProfile';
  const salt = await bcrypt.genSalt(10);
  let hashedPassword = await bcrypt.hash(password, salt); 
  return new User({
      email, username, password: hashedPassword, role, roleProfile,
      profile: new mongoose.Types.ObjectId(),
  });
}

const User = mongoose.model('User', userSchema);

exports.User = User; 
exports.userJoiSchema = userJoiSchema;
exports.createTestUser = createTestUser;