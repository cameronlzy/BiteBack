import jwt from 'jsonwebtoken';
import config from 'config';
import User from '../models/user.model.js';
import Staff from '../models/staff.model.js';

export default async function (req, res, next) {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    const user = await User.findById(decoded._id);
    if (user) {
      req.user = user;
    } else {
      const staff = await Staff.findById(decoded._id);
      if (staff) req.user = staff;
    }
  }
  catch {
    // ignore token verification errors
  }
  next();
}