import logger from '../startup/logging.js';
import { wrapError } from '../helpers/response.js';

export default function (err, _req, res, _next) {
  if (err.status) {
    return res.status(err.status).json(err.body);
  }

  logger.error(err.message, err);
  res.status(500).json(wrapError('Something Failed'));
};
