import QueueEntry from '../models/queueEntry.model.js';

export default async function (req, res, next) {
    const queueEntry = await QueueEntry.findById(req.params.id);
    if (!queueEntry) return res.status(404).send('QueueEntry not found');
    if (queueEntry.customer.toString() !== req.user.profile) return res.status(403).send('QueueEntry does not belong to customer');
    
    req.queueEntry = queueEntry;
    next();
}