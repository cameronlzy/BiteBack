import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { generateAnalytics } from '../../../services/scheduledJobs/generateAnalytics.js';
import Reservation from '../../../models/reservation.model.js';
import QueueEntry from '../../../models/queueEntry.model.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';

describe('generateAnalytics integration test', () => {
  it('computes reservations, queue, reviews and visitLoadByHour correctly', async () => {
        const todaySGT = DateTime.now().setZone('Asia/Singapore').startOf('day');
        const todayUTC = DateTime.now().toUTC().startOf('day');
        const makeDate = (h, m) => todayUTC.plus({ hours: h, minutes: m }).toJSDate();

        const todayWeekdayIdx = todaySGT.weekday - 1;
        const openingParts = Array(7).fill('x');
        openingParts[todayWeekdayIdx] = '13:00-16:00';
    
        let restaurant = createTestRestaurant();
        restaurant.openingHours = openingParts.join('|');
        await restaurant.save();

        await Reservation.create([
            { user: new mongoose.Types.ObjectId(), restaurant: restaurant._id, reservationDate: makeDate(13, 30), pax: 2, status: 'completed' },
            { user: new mongoose.Types.ObjectId(), restaurant: restaurant._id, reservationDate: makeDate(14, 15), pax: 3, status: 'event' },
            { user: new mongoose.Types.ObjectId(), restaurant: restaurant._id, reservationDate: makeDate(15, 0), pax: 4, status: 'no-show' },
        ]);

        await QueueEntry.create([
            {
                restaurant: restaurant._id,
                customer: new mongoose.Types.ObjectId(),
                pax: 1,
                queueGroup: 'small',
                status: 'seated',
                statusTimestamps: { waiting: makeDate(13, 10), seated: makeDate(13, 20) },
                queueNumber: 1,
            },
            {
                restaurant: restaurant._id,
                customer: new mongoose.Types.ObjectId(),
                pax: 3,
                queueGroup: 'medium',
                status: 'seated',
                statusTimestamps: { waiting: makeDate(14, 45), seated: makeDate(14, 55) },
                queueNumber: 1,
            },
            {
                restaurant: restaurant._id,
                customer: new mongoose.Types.ObjectId(),
                pax: 6,
                queueGroup: 'large',
                status: 'seated',
                statusTimestamps: { waiting: makeDate(15, 15), seated: makeDate(15, 25) },
                queueNumber: 1,
            },
        ]);

        let session = null;
        const analytics = await generateAnalytics(restaurant, session);

        console.log(analytics.visitLoadByHour);
        console.log(analytics.visitLoadByHour.load);

        expect(analytics.reservations.total).toBe(3);
        expect(analytics.reservations.attended).toBe(2);
        expect(analytics.reservations.noShowRate).toBeCloseTo((3 - 2) / 3);

        expect(analytics.queue.total).toBe(3);
        expect(analytics.queue.attended).toBe(3);
        expect(analytics.queue.abandonmentRate).toBeCloseTo(0);

        expect(analytics.totalVisits).toBe(5);

        expect(analytics.visitLoadByHour.startHour).toBe(13);
        expect(analytics.visitLoadByHour.load).toEqual([2, 2, 1]);
        expect(analytics.visitLoadByHour.load).toHaveLength(3);
    });
});
