import Event from '../models/event.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const event = await Event.findById(req.params.id).populate('restaurant');
    if (!event) return res.status(404).json(wrapError('Promotion not found'));
    if (!event.restaurant) return res.status(404).json(wrapError('Restaurant not found'));
    if (event.restaurant.owner.toString() !== req.user.profile) return res.status(403).json(wrapError('Event not owned by owner'));
    
    req.restaurant = event.restaurant;
    event.restaurant = event.restaurant._id;
    req.event = event;
    next();
}