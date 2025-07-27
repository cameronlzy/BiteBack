import jwt from 'jsonwebtoken';
import config from 'config';
import { wrapError } from '../helpers/response.js';

export default function (req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json(wrapError('Access denied'));

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    if (decoded.username) {
      return res.status(401).json(wrapError('Invalid temp token'));
    }

    req.user = decoded;
    next();
  }
  catch {
    res.status(401).json(wrapError('Invalid token'));
  }
}