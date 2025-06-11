import QueueEntry from '../models/queueEntry.model.js';
import _ from 'lodash';
import { findQueueGroup } from '../helpers/queue.helper';

export async function joinQueue(authUser, data) {
    const queueEntry = new QueueEntry(_.pick(data,['restaurant', 'pax']));
    queueEntry.customer = authUser.profile;
    queueEntry.queueGroup = findQueueGroup(data.pax);
    await queueEntry.save();
    return { status: 200, body: queueEntry.toObject() };
}

export async function leaveQueue(queueEntry) {
    const entryData = queueEntry.toObject();
    await queueEntry.deleteOne();
    return { status: 200, body: entryData };
}