import VisitHistory from "../../models/visitHistory.model.js";
import Reservation from "../../models/reservation.model.js";
import QueueEntry from "../../models/queueEntry.model.js";

export async function processVisitHistory(restaurant) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // get fulfilled reservations for today
    const reservations = await Reservation.find({
        restaurant: restaurant._id,
        date: { $gte: today, $lt: tomorrow },
        status: "completed"
    });

    // get admitted queue entries for today
    const queueEntries = await QueueEntry.find({
        restaurant: restaurant._id,
        date: { $gte: today, $lt: tomorrow },
        status: "seated"
    });

    for (const reservation of reservations) {
        await addVisitHistory(reservation.customer, restaurant._id, reservation.date);
    }

    for (const queue of queueEntries) {
        await addVisitHistory(queue.customer, restaurant._id, queue.date);
    }
}

async function addVisitHistory(customerId, restaurantId, visitDate) {
    await VisitHistory.updateOne(
        { customer: customerId, restaurant: restaurantId },
        { 
            $addToSet: { visits: { visitDate: visitDate, reviewed: false } }
        },
        { upsert: true }
    );
}
