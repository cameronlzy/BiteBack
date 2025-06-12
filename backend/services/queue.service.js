import QueueEntry from '../models/queueEntry.model.js';
import QueueCounter from '../models/queueCounter.model.js';
import _ from 'lodash';
import { findQueueGroup } from '../helpers/queue.helper';

const isProdEnv = process.env.NODE_ENV === 'production';

export async function joinQueue(authUser, data) {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        const queueEntry = new QueueEntry(_.pick(data,['restaurant', 'pax']));
        queueEntry.customer = authUser.profile;
        queueEntry.queueGroup = findQueueGroup(data.pax);
        queueEntry.queueNumber = await assignQueueNumber(data.restaurant, queueEntry.queueGroup, session);
        await queueEntry.save(session ? { session } : undefined);
        return { status: 200, body: queueEntry.toObject() };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
}

export async function leaveQueue(queueEntry) {
    const entryData = queueEntry.toObject();
    await queueEntry.deleteOne();
    return { status: 200, body: entryData };
}

export async function getRestaurantQueue(restaurant) {
    // get all counters for the restaurant
    const counters = await QueueCounter.find({ restaurant: restaurant });
    
    const queueSummary = {
        small: { lastNumber: 0, calledNumber: 0 },
        medium: { lastNumber: 0, calledNumber: 0 },
        large: { lastNumber: 0, calledNumber: 0 }
    };

    for (const counter of counters) {
        queueSummary[counter.queueGroup] = {
            lastNumber: counter.lastNumber,
            calledNumber: counter.calledNumber
        };
    }

    return { status: 200, body: queueSummary };
}

export async function getRestaurantQueueOverview(restaurant) {
    // get all counters for the restaurant
    const counters = await QueueCounter.find({ restaurant: restaurant._id });
    
    const queueSummary = {
        small: { lastNumber: 0, calledNumber: 0 },
        medium: { lastNumber: 0, calledNumber: 0 },
        large: { lastNumber: 0, calledNumber: 0 }
    };

    for (const counter of counters) {
        queueSummary[counter.queueGroup] = {
            lastNumber: counter.lastNumber,
            calledNumber: counter.calledNumber
        };
    }
    // find the next 3 queueEntries for the restaurant for each queueGroup
    for (const group of ['small', 'medium', 'large']) {
        const calledNumber = queueSummary[group].calledNumber;

        const waitingEntries = await QueueEntry.find({
            restaurant: restaurant._id,
            queueGroup: group,
            status: 'waiting',
            queueNumber: { $gt: calledNumber }
        })
        .sort({ queueNumber: 1 })
        .limit(3)
        .select('pax queueGroup status queueNumber statusTimestamps').lean();

        queueSummary[group].waiting = waitingEntries.map(entry => ({
            queueNumber: entry.queueNumber,
            pax: entry.pax,
            waitingSince: entry.statusTimestamps.waiting
        }));
    }

    return { status: 200, body: queueSummary };
}

// helper service
export async function assignQueueNumber(restaurantId, queueGroup, session = null) {
    const counter = await QueueCounter.findOneAndUpdate(
        { restaurant: restaurantId, queueGroup },
        { $inc: { lastNumber: 1 }, $setOnInsert: { calledNumber: 0 } },
        { new: true, upsert: true, session }
    );
    return counter.lastNumber;
}