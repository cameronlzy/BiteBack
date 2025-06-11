import Reservation from '../models/reservation.model.js';

export default async function (req, res, next) {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).send('Reservation not found');
    if (reservation.user.toString() !== req.user._id) return res.status(403).send('Reservation does not belong to user' );
    
    req.reservation = reservation;
    next();
}