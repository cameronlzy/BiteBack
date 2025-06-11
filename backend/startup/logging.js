import winston from 'winston';
import 'winston-mongodb';

const transports = [];

transports.push(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/info.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

if (process.env.NODE_ENV !== 'production') {
  winston.exceptions.handle(
    new winston.transports.File({
      filename: 'logs/uncaughtExceptions.log',
    })
  );
} else {
  winston.exceptions.handle(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
