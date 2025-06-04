const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/user.model');

module.exports = async function (req, res, next) {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    const user = await User.findById(decoded._id);
    if (user) req.user = user;
  }
  catch (ex) {}
  next();
}