import QueueEntry from '../models/queueEntry.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const queueEntry = await QueueEntry.findById(req.params.id);
    if (!queueEntry) return res.status(404).json(wrapError('QueueEntry not found'));
    if (queueEntry.customer.toString() !== req.user.profile) return res.status(403).json(wrapError('QueueEntry does not belong to customer'));
    
    req.queueEntry = queueEntry;
    next();
}