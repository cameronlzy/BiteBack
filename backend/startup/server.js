import mongoose from 'mongoose';
import config from 'config';
import logger from '../startup/logging.js';

export default async function() {
  if (process.env.NODE_ENV !== 'test') {
    const db = config.get('mongoURI');
    await mongoose.connect(db, { autoIndex: false })
      .then(() => {
        const uri = new URL(db);
        logger.info(`Connected to ${uri.host}/${uri.pathname.replace('/', '')}`);
      });
  }
}