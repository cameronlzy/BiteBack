import QueueEntry from '../models/queueEntry.model.js';

export default async function (req, res, next) {
    const queueEntry = await QueueEntry.findById(req.params.id).populate('restaurant');
    if (!queueEntry) return res.status(404).send('QueueEntry not found');
    if (queueEntry.restaurant.staff.toString() !== req.user._id) return res.status(403).send('Staff cannot access QueueEntry');
    
    req.queueEntry = queueEntry;
    req.restaurant = queueEntry.restaurant;
    next();
}