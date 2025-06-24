import { wrapError } from '../helpers/response';

export default function (req, res, next) { 
  if (req.user.role != "customer") return res.status(403).json(wrapError('Access denied: Only customers allowed'));
  next();
}