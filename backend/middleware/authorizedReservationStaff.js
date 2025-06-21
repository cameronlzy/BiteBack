import Reservation from '../models/reservation.model.js';

export default async function (req, res, next) {
    const reservation = await Reservation.findById(req.params.id).populate('restaurant');
    if (!reservation) return res.status(404).send('Reservation not found');
    if (reservation.restaurant.staff.toString() !== req.user._id) return res.status(403).send('Staff cannot manage reservation' );
    
    req.reservation = reservation;
    req.restaurant = reservation.restaurant;
    next();
}