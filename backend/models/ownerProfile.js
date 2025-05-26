const mongoose = require('mongoose');
const Joi = require('joi');
const { userJoiSchema } = require('./user');

const ownerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
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
  },
});

const OwnerProfile = mongoose.model('OwnerProfile', ownerProfileSchema);

function validateOwnerProfile(profile) {
  const schema = userJoiSchema.keys({
    role: Joi.string().valid("owner").required(),
    companyName: Joi.string().min(2).max(255).required(),
    restaurants: Joi.array().min(1).required(),
  });
  return schema.validate(profile);
}

function validateNewOwnerProfile(profile) {
  const schema = userJoiSchema.keys({
    role: Joi.string().valid("owner").required(),
    companyName: Joi.string().min(2).max(255).required(),
  });
  return schema.validate(profile);
}

exports.OwnerProfile = OwnerProfile;
exports.validateOwner = validateOwnerProfile;
exports.validateNewOwner = validateNewOwnerProfile;
