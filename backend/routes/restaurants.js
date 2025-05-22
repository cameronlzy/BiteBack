const auth = require('../middleware/auth');
const { Restaurant, createSlots } = require('../models/restaurant');
const { Reservation, validateReservation, validateNewReservation } = require('../models/reservation');
const express = require('express');
const { dateAllowPartial } = require('../utils/dateUtil');
const router = express.Router();
const { DateTime } = require('luxon');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const Joi = require('joi');

router.get('/:id/availability', auth, validateObjectId, async (req, res) => {
    // validate query
    const id = req.params.id;
    const querySchema = Joi.object({ 
        date: dateAllowPartial.required()
    });
    const { error } = querySchema.validate(req.query);    
    if (error) return res.status(400).send(error.details[0].message);
    const SGTdateString = req.query.date;

    // find restaurant
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send('Restaurant not found.');

    // get all reservations from restaurant at date
    const SGTdate = new Date(SGTdateString);
    const sgStartOfDay = DateTime.fromJSDate(SGTdate, { zone: "Asia/Singapore" })
        .startOf("day")
        .toUTC()
        .toJSDate();
    const sgEndOfDay = DateTime.fromJSDate(SGTdate, { zone: "Asia/Singapore" })
        .endOf("day")
        .toUTC()
        .toJSDate();
    const reservationsAtDate = await Reservation.find({ 
        restaurant: id, reservationDate: { $gte: sgStartOfDay, $lte: sgEndOfDay }
    }).select({ reservationDate: 1, pax: 1, _id: 0 });

    let timeSlots = createSlots(restaurant, SGTdate);
    if (!timeSlots) return res.status(200).send(-1);

    // convert reservationDate to slot time string in UTC
    const availabilityMap = {};
    timeSlots.forEach(slot => availabilityMap[slot] = restaurant.maxCapacity );
    reservationsAtDate.forEach(({ reservationDate, pax }) => {
        const slotTime = DateTime.fromJSDate(reservationDate)
            .toFormat("HH:mm");

        if (availabilityMap[slotTime]) availabilityMap[slotTime] -= pax;
    });
    const availability = timeSlots.map(slot => ({
        time: slot, 
        available: Math.max(0, availabilityMap[slot])
    }));
    return res.send(availability);
});

module.exports = router; 