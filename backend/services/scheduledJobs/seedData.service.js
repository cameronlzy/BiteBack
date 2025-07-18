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
    const localToday = DateTime.utc().setZone('Asia/Singapore').startOf('day');
    const utcToday = localToday.toUTC();
    const [allRestaurants, customers] = await Promise.all([
        Restaurant.find().lean(),
        CustomerProfile.find().select('_id').lean(),
    ]);
    const customerIds = customers.map(c => c._id);
    const reservations = [];

    for (const restaurant of allRestaurants) {
        const slots = createSlots(restaurant.openingHours, localToday);
        if (!slots.length) continue;

        for (let i = 0; i < getRandomInt(20, 50); i++) {
            const randomSlot = slots[getRandomInt(0, slots.length - 1)];
            const startTime = DateTime.fromFormat(randomSlot, 'HH:mm', { zone: 'utc' })
                .set({ year: utcToday.year, month: utcToday.month, day: utcToday.day });
            const endTime = startTime.plus({ minutes: 60 });

            reservations.push(new Reservation({
                restaurant: restaurant._id,
                customer: customerIds[getRandomInt(0, customerIds.length - 1)],
                startDate: startTime.toJSDate(),
                endDate: endTime.toJSDate(),
                pax: getRandomInt(1, 6),
                status: 'booked',
            }));
        }
    }

    if (reservations.length > 0) await Reservation.insertMany(reservations);
}

export async function markPastReservations() {
    const nowUTC = DateTime.utc();
    const oneHourAgo = nowUTC.minus({ hours: 1 });

    const reservations = await Reservation.find({
        endDate: {
            $gte: oneHourAgo.toJSDate(),
            $lte: nowUTC.toJSDate(),
        },
        status: 'booked'
    });

    await Promise.all(
        reservations.map((reservation) => {
            const status = Math.random() < 0.7 ? 'completed' : 'no-show';
            reservation.status = status;
            return reservation.save();
        })
    );
}

export async function seedQueueAndReview() {
    const nowUTC = DateTime.utc();
    const oneHourAgo = nowUTC.minus({ hours: 1 });

    const [restaurants, customers] = await Promise.all([
        Restaurant.find().lean(),
        CustomerProfile.find().select('_id').lean()
    ]);
    const customerIds = customers.map(c => c._id);
    const openRestaurants = filterOpenRestaurants(restaurants, oneHourAgo);

    for (const restaurant of openRestaurants) {
        const queueEntries = [];
        const reviews = [];

        const numEntries = getRandomInt(5, 10);
        for (let i = 0; i < numEntries; i++) {
            const customer = customerIds[getRandomInt(0, customerIds.length - 1)];
            const randomTime = oneHourAgo.plus({
                minutes: getRandomInt(0, 59),
                seconds: getRandomInt(0, 59)
            });

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

            const reviewLeft = Math.random() < 0.7 ? false : true;

            if (reviewLeft) {
                reviews.push({
                    customer,
                    restaurant: restaurant._id,
                    rating: getRandomInt(1, 5),
                    dateVisited: randomTime.toJSDate(),
                    isVisible: true
                });
            }
        }

        if (queueEntries.length > 0) {
            await QueueEntry.insertMany(queueEntries);
        }

        if (reviews.length > 0) {
            await Review.insertMany(reviews);
        }
    }
}
