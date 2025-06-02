const logger = require('../startup/logging');

module.exports = function (err, req, res, next) {
  if (err.status) {
    return res.status(err.status).send(err.body);
  }

  logger.error(err.message, err);
  res.status(500).send('Something failed.');
};
