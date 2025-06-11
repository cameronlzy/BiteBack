import jwt from 'jsonwebtoken';
import config from 'config';
import User from '../models/user.model.js';

export default async function (req, res, next) {
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