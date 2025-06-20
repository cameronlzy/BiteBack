import mongoose from 'mongoose';
import config from 'config';
import logger from '../startup/logging.js';

export default function() {
  if (process.env.NODE_ENV !== 'test') {
    const db = config.get('mongoURI');
    mongoose.connect(db, { autoIndex: false })
      .then(() => logger.info(`Connected to ${db}...`));
  }
}