const auth = require('../middleware/auth');
const { Reservation, validateReservation, validateNewReservation } = require('../models/reservation');
const express = require('express');
const { dateAllowPartial, ISOdate } = require('../utils/dateUtil');
const { DateTime } = require('luxon');
const validateObjectId = require('../middleware/validateObjectId');
const isOwner = require('../middleware/isOwner');
const Joi = require('joi');
const { Restaurant, validateRestaurant, createTestRestaurant, createSlots, convertSGTOpeningHoursToUTC } = require('../models/restaurant');
const _ = require('lodash');
const mongoose = require('mongoose');
const wrapRoutes = require('../utils/wrapRoutes');
const { User } = require('../models/user');
const { OwnerProfile } = require('../models/ownerProfile');
const router = wrapRoutes(express.Router());

const isProdEnv = process.env.NODE_ENV === 'production';

router.get('/', async (req, res) => {
    const restaurants = await Restaurant.find().sort('name');
    return res.send(restaurants);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send('The restaurant with the given ID was not found.');
    return res.send(restaurant);
});

router.get('/:id/availability', [auth, validateObjectId], async (req, res) => {
    // validate query
    const id = req.params.id;
    const querySchema = Joi.object({ 
        date: ISOdate.required()
    });
    const { error } = querySchema.validate(req.query);    
    if (error) return res.status(400).send(error.details[0].message);
    const SGTdateString = req.query.date;

    // find restaurant
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).send('Restaurant not found.');

    // get all reservations from restaurant at date
    const SGTdate = DateTime.fromISO(SGTdateString, { zone: "Asia/Singapore" });
    const utcStartOfDay = SGTdate.startOf("day").toUTC().toJSDate();
    const utcEndOfDay = SGTdate.endOf("day").toUTC().toJSDate();

    const reservationsAtDate = await Reservation.find({ 
        restaurant: id, reservationDate: { $gte: utcStartOfDay, $lte: utcEndOfDay }
    }).select({ reservationDate: 1, pax: 1, _id: 0 });

    let timeSlots = createSlots(restaurant, SGTdate.toJSDate());
    if (!timeSlots) return res.status(200).send(-1);

    // convert reservationDate to slot time string in UTC
    const availabilityMap = {};
    timeSlots.forEach(slot => availabilityMap[slot] = restaurant.maxCapacity );
    reservationsAtDate.forEach(({ reservationDate, pax }) => {
        const slotTime = DateTime.fromJSDate(reservationDate)
            .toUTC().toFormat("HH:mm");

        if (availabilityMap[slotTime]) availabilityMap[slotTime] -= pax;
    });
    const availability = timeSlots.map(slot => ({
        time: slot, 
        available: Math.max(0, availabilityMap[slot])
    }));
    return res.send(availability);
});

router.post('/', [auth, isOwner], async (req, res) => {
    // validate req
    const { error } = validateRestaurant(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    if (isProdEnv) {
        // create session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // create restaurant
            const restaurant = new Restaurant(_.pick(req.body, ['name', 'address', 'contactNumber', 'cuisines', 'maxCapacity', 'email', 'website']));
            restaurant.owner = req.user._id;
            restaurant.openingHours = convertSGTOpeningHoursToUTC(req.body.openingHours);
            await restaurant.save({ session });

            // update owner
            const user = await User.findById(req.user._id).populate('profile').session(session);
            if (!user) throw { status: 404, message: 'User not found' };
            if (!user.profile) throw { status: 404, message: 'Owner Profile not found' };

            // commit transaction
            user.profile.restaurants.push(restaurant._id);
            await user.profile.save({ session });

            await session.commitTransaction();

            return res.send(restaurant);
        } catch (err) {
            await session.abortTransaction();
            if (err.status) return res.status(err.status).send(err.message);
            
            throw err;
        } finally {
            session.endSession();
        }
    } else {
        // create restaurant
        const restaurant = new Restaurant(_.pick(req.body, ['name', 'address', 'contactNumber', 'cuisines', 'maxCapacity', 'email', 'website']));
        restaurant.owner = req.user._id;
        restaurant.openingHours = convertSGTOpeningHoursToUTC(req.body.openingHours);
        await restaurant.save();

        // update owner
        const user = await User.findById(req.user._id).populate('profile');
        if (!user) return res.status(404).send('User not found');

        const ownerProfile = user.profile;
        if (!ownerProfile) return res.status(404).send('Owner Profile not found.');

        ownerProfile.restaurants.push(restaurant._id);
        await ownerProfile.save();
        return res.send(restaurant);
    }
});

router.put('/:id', [auth, isOwner, validateObjectId], async (req, res) => {
    // validate req
    const { error } = validateRestaurant(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // look up restaurant
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send('The restaurant with the given ID was not found.');
    if (!restaurant.owner.equals(req.user._id)) return res.status(403).send('Restaurant does not belong to owner.');
    
    // update restaurant
    Object.assign(restaurant, req.body);
    restaurant.openingHours = convertSGTOpeningHoursToUTC(req.body.openingHours);
    await restaurant.save();

    return res.send(restaurant);
});

router.delete('/:id', [auth, isOwner, validateObjectId], async (req, res) => {
    if (isProdEnv) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // get ownerProfile 
            const user = await User.findById(req.user._id).populate('profile').session(session);
            if (!user) throw { status: 404, message: 'User not found.' };
            if (!user.profile) throw { status: 404, message: 'Owner Profile not found.' };

            // get restaurant
            const restaurant = await Restaurant.findById(req.params.id).session(session);
            if (!restaurant) throw { status: 404, message: 'Restaurant not found.' };
            if (!restaurant.owner.equals(req.user._id)) throw { status: 403, message: 'Restaurant does not belong to user.' };
            
            // updating owner profile
            await OwnerProfile.findByIdAndUpdate(user.profile._id,
                { $pull: { restaurants: restaurant._id }}, { session, runValidators: true }
            );

            // delete reservations from restaurant
            await Reservation.deleteMany({ restaurant: req.params.id }).session(session);

            // delete restaurant
            await Restaurant.deleteOne({ _id: req.params.id }).session(session);

            // commit transaction
            await session.commitTransaction();

            return res.send(restaurant);
        } catch (err) {
            await session.abortTransaction();
            if (err.status) return res.status(err.status).send(err.message);

            throw err;
        } finally {
            session.endSession();
        }
    } else {
        // get ownerProfile 
        const user = await User.findById(req.user._id).populate('profile');
        if (!user) return res.status(404).send('User not found');
        if (!user.profile) return res.status(404).send('Owner Profile not found.');

        // get restaurant
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).send('Restaurant not found.');
        if (!restaurant.owner.equals(req.user._id)) return res.status(403).send('Restaurant does not belong to user.');
        
        // updating owner profile
        await OwnerProfile.findByIdAndUpdate(user.profile._id,
            { $pull: { restaurants: restaurant._id } }, { runValidators: true }
        );

        // delete reservations from restaurant
        await Reservation.deleteMany({ restaurant: req.params.id });
        
        // delete restaurant
        await Restaurant.deleteOne({ _id: req.params.id });
        return res.send(restaurant);
    }
});

module.exports = router; 