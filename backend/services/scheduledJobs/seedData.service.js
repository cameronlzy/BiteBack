import { DateTime } from 'luxon';
import Restaurant from '../../models/restaurant.model.js';
import CustomerProfile from '../../models/customerProfile.model.js';
import Reservation from '../../models/reservation.model.js';
import QueueEntry from '../../models/queueEntry.model.js';
import QueueCounter from '../../models/queueCounter.model.js';
import Review from '../../models/review.model.js';
import { createSlots, filterOpenRestaurants } from '../../helpers/restaurant.helper.js';
const QUEUE_GROUPS = ['small', 'medium', 'large'];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedReservations() {
    const today = DateTime.now().setZone('Asia/Singapore').startOf('day');
    const [allRestaurants, customers] = await Promise.all([
        Restaurant.find().lean(),
        CustomerProfile.find().select('_id').lean(),
    ]);
    const customerIds = customers.map(c => c._id);
    const reservations = [];

    for (const restaurant of allRestaurants) {
        const slots = createSlots(restaurant.openingHours, today);
        if (!slots.length) continue;

        for (let i = 0; i < 20; i++) {
            const randomSlot = slots[getRandomInt(0, slots.length - 1)];
            const startTime = DateTime.fromFormat(randomSlot, 'HH:mm', { zone: 'utc' })
                .set({ year: today.year, month: today.month, day: today.day });
            const endTime = startTime.plus({ minutes: 60 });

            const status = Math.random() < 0.7 ? 'completed' : 'no-show';

            reservations.push(new Reservation({
                restaurant: restaurant._id,
                customer: customerIds[getRandomInt(0, customerIds.length - 1)],
                startDate: startTime.toJSDate(),
                endDate: endTime.toJSDate(),
                pax: getRandomInt(1, 6),
                status,
            }));
        }
    }

    if (reservations.length > 0) await Reservation.insertMany(reservations);
}

export async function seedQueueAndReview(timezone = 'Asia/Singapore') {
    const now = DateTime.now().setZone(timezone);
    const oneHourAgo = now.minus({ hours: 1 });

    const [restaurants, customers] = await Promise.all([
        Restaurant.find().lean(),
        CustomerProfile.find().select('_id').lean()
    ]);
    const customerIds = customers.map(c => c._id);
    const openRestaurants = filterOpenRestaurants(restaurants);

    for (const restaurant of openRestaurants) {
        const queueEntries = [];
        const reviews = [];

        const numEntries = getRandomInt(5, 10);
        for (let i = 0; i < numEntries; i++) {
            const customer = customerIds[getRandomInt(0, customerIds.length - 1)];
            const randomTime = oneHourAgo.plus({
                minutes: getRandomInt(0, 59),
                seconds: getRandomInt(0, 59)
            }).toUTC();

            const pax = getRandomInt(1, 6);
            const queueGroup = QUEUE_GROUPS[getRandomInt(0, QUEUE_GROUPS.length - 1)];

            const counter = await QueueCounter.findOneAndUpdate(
                { restaurant: restaurant._id, queueGroup },
                { $inc: { lastNumber: 1, calledNumber: 1 } },
                { new: true, upsert: true }
            );

            const status = Math.random() < 0.7 ? 'seated' : 'skipped';

            queueEntries.push({
                customer,
                restaurant: restaurant._id,
                pax,
                queueGroup,
                status,
                statusTimestamps: {
                    waiting: randomTime.toJSDate(),
                    [status]: randomTime.plus({ minutes: getRandomInt(5, 20) }).toJSDate()
                },
                queueNumber: counter.lastNumber,
            });

            reviews.push({
                customer,
                restaurant: restaurant._id,
                rating: getRandomInt(1, 5),
                dateVisited: randomTime.toJSDate(),
                isVisible: true
            });
        }

        if (queueEntries.length > 0) {
            await QueueEntry.insertMany(queueEntries);
        }

        if (reviews.length > 0) {
            await Review.insertMany(reviews);
        }
    }
}
