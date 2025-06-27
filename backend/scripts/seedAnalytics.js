import mongoose from 'mongoose';
import config from 'config';
import { DateTime } from 'luxon';
import DailyAnalytics from '../models/dailyAnalytics.model.js';
import { createTestAnalytics } from '../tests/factories/dailyAnalytics.factory.js';
import Restaurant from '../models/restaurant.model.js';

async function seedAnalytics(days, restaurantIdArg) {
    await mongoose.connect(config.get('mongoURI'), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: false,
    });

    const restaurant = await Restaurant.findById(restaurantIdArg);
    if (!restaurant) throw new Error(`Restaurant with ID ${restaurantIdArg} not found.`);

    const today = DateTime.now().setZone('Asia/Singapore').startOf('day').toUTC();
    const analyticsData = [];

    for (let i = 0; i < days; i++) {
        const date = today.minus({ days: i });
        const entry = createTestAnalytics(restaurant._id, date);
        analyticsData.push(entry);
    }

    await DailyAnalytics.insertMany(analyticsData);
    console.log(`${days} DailyAnalytics entries created.`);
    await mongoose.disconnect();
}

const daysArg = parseInt(process.argv[2], 10) || 180;
const restaurantIdArg = process.argv[3] || null;

(async () => {
    try {
        await seedAnalytics(daysArg, restaurantIdArg);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
