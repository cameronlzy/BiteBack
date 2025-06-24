import mongoose from 'mongoose';
import { wrapError } from '../helpers/response.js';

export default function(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json(wrapError('Invalid ID'));
  next();
}