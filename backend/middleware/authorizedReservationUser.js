const Reservation = require('../models/reservation.model');

module.exports = async function (req, res, next) {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    if (reservation.user.toString() !== req.user._id) return res.status(403).json({ message: 'Reservation does not belong to user' });
    
    req.reservation = reservation;
    next();
}