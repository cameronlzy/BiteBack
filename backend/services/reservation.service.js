const Reservation = require('../models/reservation.model');
const Restaurant = require('../models/restaurant.model');
const { DateTime } = require('luxon');
const { convertToUTCStart, convertToUTCEnd, convertToUTC } = require('../helpers/time.helper');

exports.getReservationsByOwner = async (ownerId, query) => {
    const startDate = convertToUTCStart(query.startDate);
    const endDate = query.endDate ? convertToUTCEnd(query.endDate) : null;

    // find all restaurants owned by owner
    const restaurantIds = (await Restaurant.find({ owner: ownerId }).select('_id').lean()).map(r => r._id);

    // find all the reservations for these restaurants
    const reservations = await Reservation.find({
        restaurant: { $in: restaurantIds },
        reservationDate: endDate ? { $gte: startDate, $lte: endDate } : { $gte: startDate }
    }).sort({ restaurant: 1 }).lean();

    return { status: 200, body: reservations };
};

exports.getReservationsByRestaurant = async (restaurant, query) => {
    const startDate = convertToUTCStart(query.startDate);
    const endDate = query.endDate ? convertToUTCEnd(query.endDate) : null;

    // find all reservations for restaurant
    const reservations = await Reservation.find({
        restaurant: restaurant._id,
        reservationDate: endDate ? { $gte: startDate, $lte: endDate } : { $gte: startDate }
    }).lean();
    return { status: 200, body: reservations };
};

exports.getUserReservations = async (userId) => {
    // get reservations
    const reservations = await Reservation.find({
        user: userId,
        reservationDate: { $gte: Date.now() }
    }).sort({ restaurant: 1 }).lean();

    return { status: 200, body: reservations };
};

exports.getSingleReservation = async (reservation) => {
    // check if expired
    if (reservation.reservationDate < Date.now()) {
        return { status: 404, body: 'Reservation expired' };
    }
    return { status: 200, body: reservation.toObject() };
};

exports.createReservation = async (user, body) => {
    // get restaurant
    const restaurant = await Restaurant.findById(body.restaurant).lean();
    if (!restaurant) return { status: 404, body: 'Restaurant not found.' };

    // if owner, can only reserve their own restaurants
    if (user.role === 'owner' && !restaurant.owner.equals(user._id)) return { status: 403, body: 'Owners can only reserve their own restaurants.' };

    // check availability
    const SGTdate = DateTime.fromISO(body.reservationDate, { zone: 'Asia/Singapore' });
    const UTCdate = SGTdate.toUTC();
    const currentReservations = await Reservation.find({
        restaurant: restaurant._id, reservationDate: { $gte: UTCdate.toJSDate(), $lte: UTCdate.plus({ minutes: restaurant.slotDuration }).toJSDate() }
    }).select({ pax: 1 }).lean();
    let bookedSlots = 0;
    currentReservations.forEach(({ pax }) => {
        bookedSlots += pax;
    });
    if (bookedSlots + body.pax > restaurant.maxCapacity) return { status: 409, body: 'Restaurant is fully booked at this time slot.' };

    // create reservation
    const reservation = new Reservation({
        user: user._id,
        restaurant: body.restaurant,
        reservationDate: convertToUTC(body.reservationDate),
        remarks: body.remarks,
        pax: body.pax
    });
    await reservation.save();
    return { status: 200, body: reservation.toObject() };
};

exports.updateReservation = async (reservation, update) => {
    const isDateChanging = update.reservationDate !== undefined;
    const isPaxChanging = update.pax !== undefined;

    if (isDateChanging || isPaxChanging) {
        const newDate = isDateChanging ? update.reservationDate : reservation.reservationDate.toISOString();
        const newPax = isPaxChanging ? update.pax : reservation.pax;

        const SGTdate = DateTime.fromISO(newDate, { zone: 'Asia/Singapore' });
        const UTCdate = SGTdate.toUTC();

        const restaurant = await Restaurant.findById(reservation.restaurant).select('+maxCapacity +slotDuration').lean();

        const currentReservations = await Reservation.find({
            restaurant: restaurant._id,
            reservationDate: {
                $gte: UTCdate.toJSDate(),
                $lte: UTCdate.plus({ minutes: restaurant.slotDuration }).toJSDate()
            }
        }).select({ pax: 1 }).lean();

        let bookedSlots = 0;
        currentReservations.forEach(({ pax }) => {
            bookedSlots += pax;
        });

        if (!isDateChanging) {
            bookedSlots -= reservation.pax;
        }
        if (bookedSlots + newPax > restaurant.maxCapacity) {
            return { status: 409, body: 'Restaurant is fully booked at this time slot.' };
        }
    }

    if (update.reservationDate !== undefined) {
        reservation.reservationDate = convertToUTC(update.reservationDate);
    } 
    if (update.remarks !== undefined) {
        reservation.remarks = update.remarks;
    }
    if (update.pax !== undefined) {
        reservation.pax = update.pax;
    }

    await reservation.save();
    return { status: 200, body: reservation.toObject() };
};

exports.deleteReservation = async (reservation) => {
    // delete reservation
    await Reservation.deleteOne({ _id: reservation._id });
    return { status: 200, body: reservation.toObject() };
};

exports.getReservationsByRestaurantByDate = async (restaurantId, date) => {
    // convert date
    const SGTdate = DateTime.fromISO(date, { zone: "Asia/Singapore" });
    const [utcStart, utcEnd] = [SGTdate.startOf('day').toUTC().toJSDate(), SGTdate.endOf('day').toUTC().toJSDate()];

    // find reservations by restaurant by date
    const reservations = await Reservation.find({
        restaurant: restaurantId, reservationDate: { $gte: utcStart, $lte: utcEnd }
    }).select({ reservationDate: 1, pax: 1 }).lean();

    return reservations;
};