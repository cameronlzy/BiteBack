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
        ...reservations.map(r => ({
            customer: r.user.profile.toString(),
            visitDate: new Date(Math.floor(r.reservationDate.getTime() / 1000) * 1000)
        })),
        ...queueEntries.map(q => ({
            customer: q.customer.toString(),
            visitDate: new Date(Math.floor(q.statusTimestamps.waiting.getTime() / 1000) * 1000)
        }))
    ];

    const visitsByCustomer = new Map();

    for (const { customer, visitDate } of allVisits) {
        if (!visitsByCustomer.has(customer)) {
            visitsByCustomer.set(customer, new Map());
        }
        visitsByCustomer.get(customer).set(visitDate.getTime(), {
            visitDate,
            reviewed: false
        });
    }

    const bulkOps = [];

    for (const [customerIdStr, visitMap] of visitsByCustomer.entries()) {
        const customerId = new mongoose.Types.ObjectId(customerIdStr);

        const doc = await VisitHistory.findOne({
            customer: customerId,
            restaurant: restaurant._id
        }).select('visits.visitDate').session(session);

        const existingTimestamps = new Set(
            (doc?.visits ?? []).map(v => v.visitDate.getTime())
        );

        const newVisits = Array.from(visitMap.values()).filter(
            v => !existingTimestamps.has(v.visitDate.getTime())
        );

        if (newVisits.length > 0) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        customer: customerId,
                        restaurant: restaurant._id
                    },
                    update: {
                        $push: { visits: { $each: newVisits } }
                    },
                    upsert: true
                }
            });
        }
    }

    if (bulkOps.length > 0) {
        await VisitHistory.bulkWrite(bulkOps, { session });
    }
}
