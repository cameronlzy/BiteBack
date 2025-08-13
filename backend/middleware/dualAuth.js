import jwt from 'jsonwebtoken';
import config from 'config';
import { wrapError } from '../helpers/response.js';
import User from '../models/user.model.js';

export default async function (req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json(wrapError('Access denied'));

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    const user = await User.findById(decoded._id);
    req.user = user;
    next();
  }
  catch {
    res.status(401).json(wrapError('Invalid token'));
  }
}