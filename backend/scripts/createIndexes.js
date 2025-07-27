import mongoose from 'mongoose';
import config from 'config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsFolder = path.resolve(__dirname, '../models');

async function createIndexes() {
  try {
    await mongoose.connect(config.get('mongoURI'), {
      autoIndex: false,
    });

    console.log('Connected to MongoDB');

    const modelFiles = fs.readdirSync(modelsFolder).filter(file => file.endsWith('.js'));

    for (const file of modelFiles) {
      const modelPath = path.join(modelsFolder, file);
      const { default: model } = await import(modelPath);

      if (model?.createIndexes instanceof Function) {
        await model.createIndexes();
        console.log(`${model.modelName} indexes created`);
      } else {
        console.warn(`Skipped ${file}: no createIndexes() found on default export`);
      }
    }

    console.log('All indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createIndexes();
