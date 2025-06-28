import { queueCleanup } from './queueCleanup.js';
import { generateAnalytics } from './generateAnalytics.js';
import { processVisitHistory } from './visitHistoryProcessor.js';
import { cleanupPastReservations } from './cleanupPastReservations.js'
import Restaurant from '../../models/restaurant.model.js';
import DailyAnalytics from '../../models/dailyAnalytics.model.js';
import { getOpeningHoursToday } from '../../helpers/restaurant.helper.js';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

export async function processEndOfDay() {
    const nowLuxonSGT = DateTime.now().setZone('Asia/Singapore');
    const nowTotalMinutes = nowLuxonSGT.hour * 60 + nowLuxonSGT.minute;

    const restaurants = await Restaurant.find();

    for (const restaurant of restaurants) {
        const dayHours = getOpeningHoursToday(restaurant);
        if (!dayHours || dayHours === 'x') continue;

        const [_openStr, closeStr] = dayHours.split('-');    
        const [closingHourStr, closingMinuteStr] = closeStr.split(':');
        const closingHour = parseInt(closingHourStr, 10);
        const closingMinute = parseInt(closingMinuteStr, 10);
        
        // add 30 mins buffer time
        const bufferMinutes = 30;
        let closingTotalMinutes = closingHour * 60 + closingMinute + bufferMinutes;
        closingTotalMinutes %= 1440;

        if (nowTotalMinutes >= closingTotalMinutes) {
            const todaySGT = nowLuxonSGT.startOf('day');
            const todayUTC = todaySGT.toUTC().toJSDate();
            const session = await mongoose.startSession();

            await session.withTransaction(async () => {
                const existing = await DailyAnalytics.findOne({
                    restaurant: restaurant._id,
                    date: todayUTC
                }).session(session);

                if (existing) return;

                // analytics processing
                const analyticsData = await generateAnalytics(restaurant, session);

                // adds to visit history
                await processVisitHistory(restaurant, session);

                // clears queue
                await queueCleanup(restaurant, session);

                // clears reservations
                await cleanupPastReservations(restaurant, session);

                // save doc
                await DailyAnalytics.create([analyticsData], { session });
            });
        }
    }
}