import { queueCleanup } from './queueCleanup.js';
import { generateAnalytics } from './generateAnalytics.js';
import { cleanupPastReservations } from './cleanupPastReservations.js'
import Restaurant from '../../models/restaurant.model.js';
import DailyAnalytics from '../../models/dailyAnalytics.model.js';
import { getOpeningHoursToday } from '../../helpers/restaurant.helper.js';
import mongoose from 'mongoose';

export async function processEndOfDay(nowSGT) {
    const nowTotalMinutes = nowSGT.hour * 60 + nowSGT.minute;

    const restaurants = await Restaurant.find();

    for (const restaurant of restaurants) {
        const dayHours = getOpeningHoursToday(restaurant);
        if (!dayHours || dayHours === 'x') continue;

        const [openStr, closeStr] = dayHours.split('-');    
        
        const [openHourStr, openMinuteStr] = openStr.split(':');
        const openHour = parseInt(openHourStr, 10);
        const openMinute = parseInt(openMinuteStr, 10);
        let openTotalMinutesUTC = openHour * 60 + openMinute;

        const [closeHourStr, closeMinuteStr] = closeStr.split(':');
        const closeHour = parseInt(closeHourStr, 10);
        const closeMinute = parseInt(closeMinuteStr, 10);
        let closeTotalMinutesUTC = closeHour * 60 + closeMinute;

        let openTotalMinutesSGT = (openTotalMinutesUTC + 8 * 60) % 1440;
        let closeTotalMinutesSGT = (closeTotalMinutesUTC + 8 * 60) % 1440;

        const isAfterOpen = nowTotalMinutes >= openTotalMinutesSGT;
        const isAfterClose = nowTotalMinutes >= closeTotalMinutesSGT || closeTotalMinutesSGT < openTotalMinutesSGT;

        if (isAfterClose && isAfterOpen) {
            const todaySGT = nowSGT.startOf('day');
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