const express = require('express');
const error = require('../middleware/error');
const register = require('../routes/register');
const login = require('../routes/login');
const auth = require('../routes/auth');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/auth/register', register);
  app.use('/api/auth/login', login);
  app.use('/api/auth', auth);
  app.use(error);
}