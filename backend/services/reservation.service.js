const Reservation = require('../models/reservation.model');
const Restaurant = require('../models/restaurant.model');
const { convertToUTCStart, convertToUTCEnd } = require('../helpers/time.helper');
const { validateReservation, validateNewReservation } = require('../validators/reservation.validator');

exports.getReservationsByOwner = async (ownerId, query) => {
    const startDate = convertToUTCStart(query.startDate);
    const endDate = query.endDate ? convertToUTCEnd(query.endDate) : null;

    // find all restaurants owned by owner
    const restaurantIds = (await Restaurant.find({ owner: ownerId }).select('_id')).map(r => r._id);

    // find all the reservations for these restaurants
    const reservations = await Reservation.find({
        restaurant: { $in: restaurantIds },
        reservationDate: endDate ? { $gte: startDate, $lte: endDate } : { $gte: startDate }
    }).sort({ restaurant: 1 });

    return { status: 200, body: reservations };
};

exports.getReservationsByRestaurant = async (user, restaurantId, query) => {
    const startDate = convertToUTCStart(query.startDate);
    const endDate = query.endDate ? convertToUTCEnd(query.endDate) : null;

    // find restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return { status: 404, body: 'Restaurant not found.' };
    if (!restaurant.owner.equals(user._id)) return { status: 403, body: 'Owner does not own this restaurant.' };

    // find all reservations for restaurant
    const reservations = await Reservation.find({
        restaurant: restaurantId,
        reservationDate: endDate ? { $gte: startDate, $lte: endDate } : { $gte: startDate }
    });
    return { status: 200, body: reservations };
};

exports.getUserReservations = async (userId) => {
    // get reservations
    const reservations = await Reservation.find({
        user: userId,
        reservationDate: { $gte: Date.now() }
    }).sort({ restaurant: 1 });

    return { status: 200, body: reservations };
};

exports.getSingleReservation = async (userId, reservationId) => {
    // get reservation
    const reservation = await Reservation.findOne({
        _id: reservationId,
        user: userId,
        reservationDate: { $gte: Date.now() }
    });

    if (!reservation) return { status: 404, body: 'Reservation not found or expired.' };

    return { status: 200, body: reservation };
};

exports.createReservation = async (user, body) => {
    // validate reservation
    const { error } = validateReservation(body);
    if (error) return { status: 400, body: error.details[0].message };

    // get restaurant
    const restaurant = await Restaurant.findById(body.restaurant);
    if (!restaurant) return { status: 404, body: 'Restaurant not found.' };

    // if owner, can only reserve their own restaurants
    if (user.role === 'owner' && !restaurant.owner.equals(user._id)) return { status: 403, body: 'Owners can only reserve their own restaurants.' };

    // create reservation
    const reservation = new Reservation({
        user: user._id,
        restaurant: body.restaurant,
        reservationDate: convertToUTCStart(body.reservationDate),
        remarks: body.remarks,
        pax: body.pax
    });
    await reservation.save();
    return { status: 200, body: reservation };
};

exports.updateReservation = async (userId, reservationId, update) => {
    // validate new reservation
    const { error } = validateNewReservation(update);
    if (error) return { status: 400, body: error.details[0].message };

    // find reservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return { status: 404, body: 'Reservation not found.' };
    if (!reservation.user.equals(userId)) return { status: 403, body: 'Reservation does not belong to user.' };

    // update reservation
    reservation.set({
        reservationDate: update.reservationDate,
        remarks: update.remarks,
        pax: update.pax
    });
    await reservation.save();

    return { status: 200, body: reservation };   
};

exports.deleteReservation = async (userId, reservationId) => {
    // find reservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return { status: 404, body: 'Reservation not found.' };
    if (!reservation.user.equals(userId)) return { status: 403, body: 'Forbidden.' };

    // delete reservation
    await Reservation.deleteOne({ _id: reservationId });
    return { status: 200, body: reservation };
};