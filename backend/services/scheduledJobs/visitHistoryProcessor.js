import VisitHistory from "../../models/visitHistory.model.js";
import Reservation from "../../models/reservation.model.js";
import QueueEntry from "../../models/queueEntry.model.js";
import { DateTime } from "luxon";

export async function processVisitHistory(restaurant, session) {
    const todaySGT = DateTime.now().setZone('Asia/Singapore').startOf('day');
    const tomorrowSGT = todaySGT.plus({ days: 1 });
    const todayUTC = todaySGT.toUTC().toJSDate();
    const tomorrowUTC = tomorrowSGT.toUTC().toJSDate();

    // get fulfilled reservations for today
    const reservations = await Reservation.find({
        restaurant: restaurant._id,
        date: { $gte: todayUTC, $lt: tomorrowUTC },
        status: "completed"
    }).session(session);

    // get admitted queue entries for today
    const queueEntries = await QueueEntry.find({
        restaurant: restaurant._id,
        date: { $gte: todayUTC, $lt: tomorrowUTC },
        status: "seated"
    }).session(session);

    // combine visits
    const allVisits = [
        ...reservations.map(r => ({ customer: r.customer.toString(), date: r.date })),
        ...queueEntries.map(q => ({ customer: q.customer.toString(), date: q.date }))
    ];

    const visitsByCustomer = allVisits.reduce((acc, visit) => {
        if (!acc[visit.customer]) acc[visit.customer] = [];
        acc[visit.customer].push({ visitDate: visit.date, reviewed: false });
        return acc;
    }, {});

    const bulkOps = Object.entries(visitsByCustomer).map(([customerId, visits]) => ({
        updateOne: {
            filter: { customer: customerId, restaurant: restaurant._id },
            update: { $addToSet: { visits: { $each: visits } } },
            upsert: true
        }
    }));

    if (bulkOps.length > 0) {
        await VisitHistory.bulkWrite(bulkOps).session(session);
    }
}
