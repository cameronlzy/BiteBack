const config = require('config');

module.exports = function() {
  if (!config.get('jwtPrivateKey')) {
    throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
  }

  if (!config.get('cloudinary.cloudName') || !config.get('cloudinary.apiKey') || !config.get('cloudinary.apiSecret')) {
    throw new Error('FATAL ERROR: cloudinary configs not defined.');
  }
}