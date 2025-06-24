import Reservation from '../models/reservation.model.js';
import Restaurant from '../models/restaurant.model.js';
import { DateTime } from 'luxon';
import { convertToUTC } from '../helpers/time.helper.js';
import { getCurrentTimeSlotStartUTC } from '../helpers/restaurant.helper.js';
import { error, success } from '../helpers/response.js';

// retired, might use for analytics
// exports.getReservationsByOwner = async (ownerId, query) => {
//     const startDate = convertToUTCStart(query.startDate);
//     const endDate = query.endDate ? convertToUTCEnd(query.endDate) : null;

//     // find all restaurants owned by owner
//     const restaurantIds = (await Restaurant.find({ owner: ownerId }).select('_id').lean()).map(r => r._id);

//     // find all the reservations for these restaurants
//     const reservations = await Reservation.find({
//         restaurant: { $in: restaurantIds },
//         reservationDate: endDate ? { $gte: startDate, $lte: endDate } : { $gte: startDate }
//     }).sort({ restaurant: 1 }).lean();

//     return { status: 200, body: reservations };
// };

export async function getReservationsByRestaurant(restaurant) {
    const timeSlotStartUTC = getCurrentTimeSlotStartUTC(restaurant);
    if (!timeSlotStartUTC) return success([]);
    const reservations = await Reservation.find({
        restaurant: restaurant._id,
        reservationDate: { 
            $gte: timeSlotStartUTC.toJSDate(),
            $lte: timeSlotStartUTC.plus({ minutes: restaurant.slotDuration }).toJSDate()
        }
    }).populate({
        path: 'user',
        select: '',
        populate: {
            path: 'profile',
            select: 'name contactNumber'
        }
    }).lean();

    const mappedReservations = reservations.map(reservation => {
        return {
            ...reservation,
            user: {
                name: reservation.user?.profile?.name,
                contactNumber: reservation.user?.profile?.contactNumber
            }
        };
    });
    return success(mappedReservations);
}

export async function getUserReservations(userId) {
    // get reservations
    const reservations = await Reservation.find({
        user: userId,
        reservationDate: { $gte: Date.now() }
    }).sort({ restaurant: 1 }).lean();

    return success(reservations);
}

export async function getSingleReservation(reservation) {
    // check if expired
    if (reservation.reservationDate < Date.now()) {
        return error(404, 'Reservation expired');
    }
    return success(reservation.toObject());
}

export async function createReservation(user, data) {
    // get restaurant
    const restaurant = await Restaurant.findById(data.restaurant).lean();
    if (!restaurant) return error(404, 'Restaurant not found');

    // if owner, can only reserve their own restaurants
    if (user.role === 'owner' && !restaurant.owner.equals(user._id)) return error(403, 'Owners can only reserve their own restaurants');

    // check availability
    const SGTdate = DateTime.fromISO(data.reservationDate, { zone: 'Asia/Singapore' });
    const UTCdate = SGTdate.toUTC();
    const currentReservations = await Reservation.find({
        restaurant: restaurant._id, reservationDate: { $gte: UTCdate.toJSDate(), $lte: UTCdate.plus({ minutes: restaurant.slotDuration }).toJSDate() }
    }).select({ pax: 1 }).lean();
    let bookedSlots = 0;
    currentReservations.forEach(({ pax }) => {
        bookedSlots += pax;
    });
    if (bookedSlots + data.pax > restaurant.maxCapacity) return error(409, 'Restaurant is fully booked at this time slot');

    // create reservation
    const reservation = new Reservation({
        user: user._id,
        restaurant: data.restaurant,
        reservationDate: convertToUTC(data.reservationDate),
        remarks: data.remarks,
        pax: data.pax,
        status: user.role === 'owner' ? 'event' : 'booked'
    });
    await reservation.save();
    return success(reservation.toObject());
}

export async function updateReservationStatus(reservation, status) {
    reservation.status = status;
    await reservation.save();
    reservation.restaurant = reservation.restaurant._id;
    return success(reservation.toObject());
}

export async function updateReservation(reservation, update) {
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
            return error(409, 'Restaurant is fully booked at this time slot');
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
    return success(reservation.toObject());
}

export async function deleteReservation(reservation) {
    // delete reservation
    await Reservation.deleteOne({ _id: reservation._id });
    return success(reservation.toObject());
}

export async function getReservationsByRestaurantByDate(restaurantId, date) {
    // convert date
    const SGTdate = DateTime.fromISO(date, { zone: "Asia/Singapore" });
    const [utcStart, utcEnd] = [SGTdate.startOf('day').toUTC().toJSDate(), SGTdate.endOf('day').toUTC().toJSDate()];

    // find reservations by restaurant by date
    const reservations = await Reservation.find({
        restaurant: restaurantId, reservationDate: { $gte: utcStart, $lte: utcEnd }
    }).select({ reservationDate: 1, pax: 1 }).lean();

    return reservations;
}