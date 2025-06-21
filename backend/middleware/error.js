import logger from '../startup/logging.js';

export default function (err, req, res, _next) {
  if (err.status) {
    return res.status(err.status).send(err.body);
  }

  logger.error(err.message, err);
  res.status(500).send('Something failed.');
};
