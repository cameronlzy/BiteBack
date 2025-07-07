import Reservation from '../models/reservation.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json(wrapError('Reservation not found'));
    if (reservation.customer.toString() !== req.user.profile) return res.status(403).json(wrapError('Reservation does not belong to customer' ));
    
    req.reservation = reservation;
    next();
}