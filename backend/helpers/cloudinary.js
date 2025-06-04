const cloudinary = require('cloudinary').v2;
const config = require('config');

cloudinary.config({
  cloud_name: config.get('cloudinary.cloudName'),
  api_key: config.get('cloudinary.apiKey'),
  api_secret: config.get('cloudinary.apiSecret'),
});

module.exports = cloudinary;
