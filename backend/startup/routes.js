const express = require('express');
const cookieParser = require('cookie-parser');
const error = require('../middleware/error');
const auth = require('../routes/auth.route');
const reservations = require('../routes/reservation.route');
const restaurants = require('../routes/restaurant.route');
const reviews = require('../routes/review.route');
const customers = require('../routes/customer.route');
const owners = require('../routes/owner.route');
const queue = require('../routes/queue.route');

module.exports = function(app) {
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', auth);
  app.use('/api/reservations', reservations);
  app.use('/api/restaurants', restaurants);
  app.use('/api/reviews', reviews);
  app.use('/api/owners', owners);
  app.use('/api/customers', customers);
  app.use('/api/queue', queue);

  // to log error
  app.use(error);
}