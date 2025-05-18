const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');
const infoLogger = require('../models/infoLogger');

module.exports = function() {
  if (process.env.NODE_ENV !== 'test') {
    const db = config.get('db');
    mongoose.connect(db)
      .then(() => infoLogger.info(`Connected to ${db}...`));
  }
}