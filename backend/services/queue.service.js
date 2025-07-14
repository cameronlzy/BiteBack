import QueueEntry from '../models/queueEntry.model.js';
import QueueCounter from '../models/queueCounter.model.js';
import Restaurant from '../models/restaurant.model.js';
import _ from 'lodash';
import { findQueueGroup } from '../helpers/queue.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';
import { addVisitToHistory } from './visitHistory.service.js';
import { adjustPoints } from './rewardPoint.service.js';
// import { notifyClient } from '../helpers/sse.helper.js';
import { error, success } from '../helpers/response.js';

export async function joinQueue(authUser, data) {
    return await withTransaction(async (session) => {
        const restaurant = await Restaurant.findById(data.restaurant).select('queueEnabled').session(session).lean();
        if (!restaurant.queueEnabled) return error(403, 'Online queue is currently disabled');

        const queueEntry = new QueueEntry(_.pick(data,['restaurant', 'pax']));
        queueEntry.customer = authUser.profile;
        queueEntry.queueGroup = findQueueGroup(data.pax);
        queueEntry.queueNumber = await assignQueueNumber(data.restaurant, queueEntry.queueGroup, session);
        await queueEntry.save(wrapSession(session));

        return success(queueEntry.toObject());
    });
}

export async function leaveQueue(queueEntry) {
    const entryData = queueEntry.toObject();
    await queueEntry.deleteOne();
    return success(entryData);
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

    return success(queueSummary);
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

    return success(queueSummary);
}

export async function callNext(restaurant, queueGroup) {
    return await withTransaction(async (session) => {
        const counter = await QueueCounter.findOne(
            { restaurant: restaurant._id, queueGroup }, null
        ).session(session);
        if (!counter) return success(null, 204); // empty queue

        const nextEntry = await QueueEntry.findOne({
            restaurant: restaurant._id,
            queueGroup,
            status: 'waiting',
            queueNumber: { $gt: counter.calledNumber }
        })
        .sort({ queueNumber: 1 })
        .session(session);

        if (!nextEntry) return success(null, 204); // empty queue
        nextEntry.status = 'called';
        nextEntry.statusTimestamps.called = new Date();
        await nextEntry.save(wrapSession(session));

        counter.calledNumber = nextEntry.queueNumber;
        await counter.save(wrapSession(session));

        // notify customer
        // notifyClient(nextEntry.customer.toString(), { queueEntry: nextEntry._id, status: 'called' });

        return success(nextEntry);
    });
}

export async function updateQueueEntryStatus(queueEntry, update) {
    return await withTransaction(async (session) => {
        queueEntry.status = update.status;
        queueEntry.statusTimestamps[update.status] = new Date();
        queueEntry.restaurant = queueEntry.restaurant._id;
        await queueEntry.save(wrapSession(session));

        if (update.status === 'seated') {
            await addVisitToHistory(queueEntry.customer, queueEntry.restaurant, queueEntry.statusTimestamps.waiting, session);
            await adjustPoints(100, queueEntry.restaurant, queueEntry.customer, session);
        }

        // notifyClient(queueEntry.customer.toString(), { queueEntry: queueEntry._id, status: queueEntry.status });
        return success(queueEntry.toObject());
    });
}

export async function toggleQueue(restaurant, enabled) {
    restaurant.queueEnabled = enabled;
    await restaurant.save();
    return success({ queueEnabled: restaurant.queueEnabled });
}

// helper service
export async function assignQueueNumber(restaurantId, queueGroup, session = undefined) {
    const counter = await QueueCounter.findOneAndUpdate(
        { restaurant: restaurantId, queueGroup },
        { $inc: { lastNumber: 1 }, $setOnInsert: { calledNumber: 0 } },
        { new: true, upsert: true }
    ).session(session);
    return counter.lastNumber;
}