const winston = require('winston');
require('winston-mongodb');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/info.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

winston.exceptions.handle(
  new winston.transports.File({ filename: 'logs/uncaughtExceptions.log' })
);

module.exports = logger;
