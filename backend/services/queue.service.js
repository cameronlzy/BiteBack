const QueueEntry = require('../models/queueEntry.model');
const _ = require('lodash');
const { findQueueGroup } = require('../helpers/queue.helper');

exports.joinQueue = async (authUser, data) => {
    const queueEntry = new QueueEntry(_.pick(data,['restaurant', 'pax']));
    queueEntry.customer = authUser.profile;
    queueEntry.queueGroup = findQueueGroup(data.pax);
    await queueEntry.save();
    return { status: 200, body: queueEntry.toObject() };
};

exports.leaveQueue = async (queueEntry) => {
    const entryData = queueEntry.toObject();
    await queueEntry.deleteOne();
    return { status: 200, body: entryData };
};