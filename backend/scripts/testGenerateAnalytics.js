import mongoose from 'mongoose';
import { generateAnalytics } from '../services/scheduledJobs/generateAnalytics.js';
import Restaurant from '../models/restaurant.model.js';
import config from 'config';

async function run(restaurantId) {
    if (!restaurantId) {
        console.error('Usage: node testGenerateAnalytics.js <restaurantId>');
        process.exit(1);
    }

    const mongoUri = config.get('mongoUri');
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            console.error(`Restaurant with ID ${restaurantId} not found.`);
            process.exit(1);
        }
        const session = await mongoose.startSession();
        const analytics = await generateAnalytics(restaurant, session);

        console.log('Generated Analytics:');
        console.dir(analytics, { depth: null, colors: true });

        await session.endSession();
    } catch (err) {
        console.error('Error running generateAnalytics:', err);
    } finally {
        await mongoose.disconnect();
    }
}

const restaurantId = process.argv[2];
run(restaurantId);
