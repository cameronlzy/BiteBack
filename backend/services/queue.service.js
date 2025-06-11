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

// helper service
export async function assignQueueNumber(restaurantId, queueGroup, session = null) {
    const counter = await QueueCounter.findOneAndUpdate(
        { restaurant: restaurantId, queueGroup },
        { $inc: { lastNumber: 1 }, $setOnInsert: { calledNumber: 0 } },
        { new: true, upsert: true, session }
    );
    return counter.lastNumber;
}