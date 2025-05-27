const express = require('express');
const error = require('../middleware/error');
const auth = require('../routes/auth');
const reservations = require('../routes/reservations');
const restaurants = require('../routes/restaurants');
const reviews = require('../routes/reviews');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/auth', auth);
  app.use('/api/reservations', reservations);
  app.use('/api/restaurants', restaurants);
  app.use('/api/reviews', reviews);

  // to log error
  app.use(error);
}