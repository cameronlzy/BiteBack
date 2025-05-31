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

exports.getReservationsByRestaurant = async (owner, restaurantId, query) => {
    const startDate = convertToUTCStart(query.startDate);
    const endDate = query.endDate ? convertToUTCEnd(query.endDate) : null;

    // find restaurant
    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) return { status: 404, body: 'Restaurant not found.' };
    if (!restaurant.owner.equals(owner._id)) return { status: 403, body: 'Owner does not own this restaurant.' };

    // find all reservations for restaurant
    const reservations = await Reservation.find({
        restaurant: restaurantId,
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

exports.getSingleReservation = async (userId, reservationId) => {
    // get reservation
    const reservation = await Reservation.findOne({
        _id: reservationId,
        user: userId,
        reservationDate: { $gte: Date.now() }
    }).lean();

    if (!reservation) return { status: 404, body: 'Reservation not found or expired.' };

    return { status: 200, body: reservation };
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

exports.updateReservation = async (userId, reservationId, update) => {
    // find reservation
    const reservation = await Reservation.findById(reservationId).populate('restaurant');
    if (!reservation) return { status: 404, body: 'Reservation not found.' };
    if (!reservation.user.equals(userId)) return { status: 403, body: 'Reservation does not belong to user.' };

    // check availability
    const SGTdate = DateTime.fromISO(update.reservationDate, { zone: 'Asia/Singapore' });
    const UTCdate = SGTdate.toUTC();
    const currentReservations = await Reservation.find({
        restaurant: reservation.restaurant._id, reservationDate: { $gte: UTCdate.toJSDate(), $lte: UTCdate.plus({ minutes: reservation.restaurant.slotDuration }).toJSDate() }
    }).select({ pax: 1 }).lean();
    let bookedSlots = 0;
    currentReservations.forEach(({ pax }) => {
        bookedSlots += pax;
    });
    if (bookedSlots + update.pax > reservation.restaurant.maxCapacity) return { status: 409, body: 'Restaurant is fully booked at this time slot.' };

    // update reservation
    reservation.set({
        reservationDate: convertToUTC(update.reservationDate),
        remarks: update.remarks,
        pax: update.pax
    });
    await reservation.save();

    return { status: 200, body: reservation.toObject() };   
};

exports.deleteReservation = async (userId, reservationId) => {
    // find reservation
    const reservation = await Reservation.findById(reservationId).lean();
    if (!reservation) return { status: 404, body: 'Reservation not found.' };
    if (!reservation.user.equals(userId)) return { status: 403, body: 'Forbidden.' };

    // delete reservation
    await Reservation.deleteOne({ _id: reservationId });
    return { status: 200, body: reservation };
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