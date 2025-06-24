import { wrapError } from '../helpers/response.js';

export default function (req, res, next) { 
  if (req.user.role != "owner") return res.status(403).json(wrapError('Access denied: Only owners allowed'));
  next();
}