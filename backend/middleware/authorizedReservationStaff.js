import Reservation from '../models/reservation.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const reservation = await Reservation.findById(req.params.id).populate('restaurant');
    if (!reservation) return res.status(404).json(wrapError('Reservation not found'));
    if (reservation.restaurant.staff.toString() !== req.user._id) return res.status(403).json(wrapError('Staff cannot manage reservation' ));
    
    req.reservation = reservation;
    req.restaurant = reservation.restaurant;
    next();
}