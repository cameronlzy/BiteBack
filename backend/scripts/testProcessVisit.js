import mongoose from 'mongoose';
import { processVisitHistory } from '../services/scheduledJobs/visitHistoryProcessor.js';
import Restaurant from '../models/restaurant.model.js';
import config from 'config';

async function run(restaurantId) {
    if (!restaurantId) {
        console.error('Usage: node testVisitHistory.js <restaurantId>');
        process.exit(1);
    }

    const mongoUri = config.get('mongoURI');
    await mongoose.connect(mongoUri, { autoIndex: false });

    try {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            console.error(`Restaurant with ID ${restaurantId} not found.`);
            process.exit(1);
        }
        const session = await mongoose.startSession();
        await processVisitHistory(restaurant, session);
        
        await session.endSession();
    } catch (err) {
        console.error('Error running generateAnalytics:', err);
    } finally {
        await mongoose.disconnect();
    }
}

const restaurantId = process.argv[2];
run(restaurantId);
