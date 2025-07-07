import mongoose from 'mongoose';
import { wrapError } from '../helpers/response.js';

export default function validateObjectIds(fields = ['id']) {
  return (req, res, next) => {
    for (const field of fields) {
      if (!mongoose.Types.ObjectId.isValid(req.params[field])) {
        return res.status(400).json(wrapError(`Invalid ID for param '${field}'`));
      }
    }
    next();
  };
}