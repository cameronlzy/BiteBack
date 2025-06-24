import QueueEntry from '../models/queueEntry.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const queueEntry = await QueueEntry.findById(req.params.id).populate('restaurant');
    if (!queueEntry) return res.status(404).json(wrapError('QueueEntry not found'));
    if (queueEntry.restaurant.staff.toString() !== req.user._id) return res.status(403).json(wrapError('Staff cannot access QueueEntry'));
    
    req.queueEntry = queueEntry;
    req.restaurant = queueEntry.restaurant;
    next();
}