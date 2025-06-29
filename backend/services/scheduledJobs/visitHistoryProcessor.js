import VisitHistory from "../../models/visitHistory.model.js";
import Reservation from "../../models/reservation.model.js";
import QueueEntry from "../../models/queueEntry.model.js";
import { DateTime } from "luxon";
import mongoose from 'mongoose';

export async function processVisitHistory(restaurant, session) {
    const todaySGT = DateTime.now().setZone('Asia/Singapore').startOf('day');
    const tomorrowSGT = todaySGT.plus({ days: 1 });
    const todayUTC = todaySGT.toUTC().toJSDate();
    const tomorrowUTC = tomorrowSGT.toUTC().toJSDate();

    // get fulfilled reservations for today
    const reservations = await Reservation.find({
        restaurant: restaurant._id,
        reservationDate: { $gte: todayUTC, $lt: tomorrowUTC },
        status: 'completed'
    }).populate('user').session(session);

    // get admitted queue entries for today
    const queueEntries = await QueueEntry.find({
        restaurant: restaurant._id,
        'statusTimestamps.waiting': { $gte: todayUTC, $lt: tomorrowUTC },
        status: 'seated'
    }).select('customer statusTimestamps.waiting').session(session);

    // combine visits
    const allVisits = [
        ...reservations.map(r => ({ customer: r.user.profile, date: r.reservationDate })),
        ...queueEntries.map(q => ({ customer: q.customer, date: q.statusTimestamps.waiting }))
    ];

    const visitsByCustomer = new Map();

    for (const visit of allVisits) {
        const customerId = visit.customer.toString();

        const roundedDate = new Date(Math.floor(visit.date.getTime() / 1000) * 1000);

        if (!visitsByCustomer.has(customerId)) {
            visitsByCustomer.set(customerId, []);
        }
        visitsByCustomer.get(customerId).push({
            visitDate: roundedDate,
            reviewed: false
        });
    }

    const bulkOps = [];

    for (const [customerIdStr, visits] of visitsByCustomer.entries()) {
        bulkOps.push({
            updateOne: {
                filter: {
                    customer: new mongoose.Types.ObjectId(customerIdStr),
                    restaurant: restaurant._id
                },
                update: {
                    $addToSet: { visits: { $each: visits } }
                },
                upsert: true
            }
        });
    }
    if (bulkOps.length > 0) {
        await VisitHistory.bulkWrite(bulkOps, { session });
    }
}
