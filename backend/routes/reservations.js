const auth = require('../middleware/auth');
const { Restaurant, createSlots } = require('../models/restaurant');
const { Reservation, validateReservation, validateNewReservation } = require('../models/reservation');
const express = require('express');
const { dateFullOnly, dateAllowPartial } = require('../utils/dateUtil');
const router = express.Router();
const { DateTime } = require('luxon');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const Joi = require('joi');

router.get('/owner', auth, isOwner, async (req, res) => {
    try {
    // validate query
    const ownerId = req.user._id;
    const querySchema = Joi.object({
        startDate: dateAllowPartial.required(),
        endDate: dateAllowPartial
    });
    const { error } = querySchema.validate(req.query);    
    if (error) return res.status(400).send(error.details[0].message);
    const { startDate, endDate } = req.query;

    // convert date from SGT to UTC, then if endDate doesnt not exist, query for same day only
    const startDateUTC = DateTime.fromISO(startDate, { zone: 'Asia/Singapore' }).startOf('day').toUTC().toJSDate();
    const endDateUTC = endDate
        ? DateTime.fromISO(endDate, { zone: 'Asia/Singapore' }).endOf('day').toUTC().toJSDate()
        : null;

    // find all restaurants owned by owner
    const ownedRestaurants = await Restaurant.find({ owner: ownerId }).select('_id');
    const restaurantIds = ownedRestaurants.map(r => r._id);
    
    // find all the reservations for restaurant
    let reservations;
    if (endDateUTC) {
        reservations = await Reservation.find({ 
            restaurant: { $in: restaurantIds },
            reservationDate: { $gte: startDateUTC , $lte: endDateUTC },
        }).sort({ restaurant: 1 });
    } else {
        reservations = await Reservation.find({ 
            restaurant: { $in: restaurantIds },
            reservationDate: { $gte: startDateUTC },
        }).sort({ restaurant: 1 });
    }

    return res.send(reservations);
} catch (err) {
    console.error(err);
}
});

router.get('/restaurant/:id', auth, isOwner, validateObjectId, async (req, res) => {
    // validate query
    const restaurantId = req.params.id;
    const querySchema = Joi.object({
        startDate: dateAllowPartial.required(),
        endDate: dateAllowPartial
    });
    const { error } = querySchema.validate(req.query);    
    if (error) return res.status(400).send(error.details[0].message);
    const { startDate, endDate } = req.query;

    // convert date from SGT to UTC, then if endDate doesnt not exist, query for same day only
    const startDateUTC = DateTime.fromISO(startDate, { zone: 'Asia/Singapore' }).startOf('day').toUTC().toJSDate();
    const endDateUTC = endDate
        ? DateTime.fromISO(endDate, { zone: 'Asia/Singapore' }).endOf('day').toUTC().toJSDate()
        : null;

    // find restaurant
    const restaurant = await Restaurant.findById(restaurantId);

    // if id does not belong to a restaurant
    if (!restaurant) return res.status(404).send('Restaurant not found.');

    // if restaurant does not owned by owner
    if (restaurant.owner != req.user._id) return res.status(403).send('Restaurant Owner does not own this restaurant');
    
    // find all the reservations for restaurant
    let reservations;
    if (endDateUTC) {
        reservations = await Reservation.find({ 
            restaurant: restaurantId,
            reservationDate: { $gte: startDateUTC , $lte: endDateUTC },
        });
    } else {
        reservations = await Reservation.find({ 
            restaurant: restaurantId,
            reservationDate: { $gte: startDateUTC },
        });
    }

    return res.send(reservations);
});

router.get('/', auth, async (req, res) => {
    const currentDate = Date.now();
    const reservations = await Reservation.find({ 
        user: req.user._id,
        reservationDate: { $gte: currentDate }
    }).sort({ restaurant: 1 });
    return res.send(reservations);
});

router.post('/', auth, async (req, res) => {
    // validate request
    const { error } = validateReservation(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    // convert SGT date to UTC date
    const UTCDate = DateTime
        .fromISO(req.body.reservationDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
    
    // if owner, can only reserve their own restaurants
    if (req.user.role == 'owner') {
        let restaurant = await Restaurant.findById(req.body.restaurant);
        if (restaurant.owner != req.user._id) return res.status(403).send('Owners can only reserve their own restaurants.');
    }

    // create reservation
    const reservation = new Reservation({
        user: req.user._id,
        restaurant: req.body.restaurant,
        reservationDate: UTCDate,
        pax: req.body.pax
    });
    await reservation.save();

    return res.send(reservation);
});

router.get('/:id', auth, validateObjectId, async (req, res) => {
    const id = req.params.id;
    const currentDate = Date.now();
    const reservation = await Reservation.findOne({ 
        _id: id,
        reservationDate: { $gte: currentDate },
        user: req.user._id
    });

    if (!reservation) return res.status(404).send('Reservation not found or expired.');

    return res.send(reservation);
});

router.put('/:id', auth, validateObjectId, async (req, res) => {
    // validate new reservation
    const { error } = validateNewReservation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // look up reservation
    let reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).send('Reservation not found.');
    if (reservation.user != req.user._id) return res.status(403).send('Reservation does not belong to user.');

    // update reservation
    reservation.set({
        reservationDate: req.body.newReservationDate,
        pax: req.body.newPax
    });
    await reservation.save();

    res.send(reservation);
});

router.delete('/:id', auth, validateObjectId, async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).send('Reservation not found.');
    if (reservation.user != req.user._id) return res.status(403).send('Reservation does not belong to user.');
    await Reservation.deleteOne({ _id: req.params.id });
    return res.send(reservation);
});

module.exports = router; 