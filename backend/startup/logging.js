const winston = require('winston');
const infoLogger = require('../models/infoLogger');
// require('winston-mongodb');

module.exports = function() {
  winston.exceptions.handle(
    new winston.transports.File({ filename: 'uncaughtExceptions.log' }));
  
  process.on('unhandledRejection', (ex) => {
    throw ex;
  });

  // winston.add(winston.transports.MongoDB, { 
  //   db: 'mongodb://localhost/vidly',
  //   level: 'info'
  // });  
}