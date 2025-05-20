const express = require('express');
const error = require('../middleware/error');
const auth = require('../routes/auth');
const reservation = require('../routes/reservation');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/auth', auth);
  app.use('/api/reservation', reservation);
  app.use(error);
}