import Reservation from '../models/reservation.model.js';
import Restaurant from '../models/restaurant.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import { DateTime } from 'luxon';
import { getCurrentTimeSlotStartUTC } from '../helpers/restaurant.helper.js';
import { addVisitToHistory } from './visitHistory.service.js';
import { adjustPoints } from './rewardPoint.service.js';
import { error, success } from '../helpers/response.js';
import { withTransaction, wrapSession } from '../helpers/transaction.helper.js';

// needs changes
export async function getReservationsByRestaurant(restaurant) {
    const timeSlotStartUTC = getCurrentTimeSlotStartUTC(restaurant);
    if (!timeSlotStartUTC) return success([]);
    const reservations = await Reservation.find({
        restaurant: restaurant._id,
        reservationDate: { 
            $gte: timeSlotStartUTC.toJSDate(),
            $lte: timeSlotStartUTC.plus({ minutes: restaurant.slotDuration }).toJSDate()
        }
    }).populate('customer', 'name contactNumber').lean();

    // const mappedReservations = reservations.map(reservation => {
    //     return {
    //         ...reservation,
    //         customer: {
    //             name: reservation.user?.profile?.name,
    //             contactNumber: reservation.user?.profile?.contactNumber
    //         }
    //     };
    // });
    return success(reservations);
}

export async function getUserReservations(profile) {
    // get reservations
    const now = new Date();
    const reservations = await Reservation.find({
        customer: profile,
        reservationDate: { $gte: now }
    }).sort({ restaurant: 1 }).lean();

    return success(reservations);
}

export async function getSingleReservation(reservation) {
    // check if expired
    if (reservation.reservationDate < new Date()) {
        return error(404, 'Reservation expired');
    }
    return success(reservation.toObject());
}

export async function createReservation(authUser, data) {
    // get restaurant
    const restaurant = await Restaurant.findById(data.restaurant).lean();
    if (!restaurant) return error(404, 'Restaurant not found');

    // check availability
    const date = DateTime.fromISO(data.reservationDate, { zone: restaurant.timezone });
    const UTCdate = date.toUTC();
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
        customer: authUser.profile,
        restaurant: data.restaurant,
        reservationDate: UTCdate.toJSDate(),
        remarks: data.remarks,
        pax: data.pax,
    });
    await reservation.save();
    return success(reservation.toObject());
}

export async function updateReservationStatus(reservation, status) {
    return await withTransaction(async (session) => {
        reservation.status = status;
        await reservation.save(wrapSession(session));

        if (status === 'completed') {
            const customer = await CustomerProfile.findById(reservation.customer).lean();
            await addVisitToHistory(customer, reservation.restaurant._id, reservation.reservationDate, session);
            await adjustPoints(100, reservation.restaurant._id, customer, session);
        }
        reservation.restaurant = reservation.restaurant._id;
        return success(reservation.toObject());
    });
}

export async function updateReservation(reservation, update) {
    const isDateChanging = update.reservationDate !== undefined;
    const isPaxChanging = update.pax !== undefined;
    let newDateUTC;

    if (isDateChanging || isPaxChanging) {
        const newDate = isDateChanging ? update.reservationDate : reservation.reservationDate.toISOString();
        const newPax = isPaxChanging ? update.pax : reservation.pax;
        const restaurant = await Restaurant.findById(reservation.restaurant).select('+maxCapacity +slotDuration +timezone').lean();

        const date = DateTime.fromISO(newDate, { zone: restaurant.timezone });
        const UTCdate = date.toUTC();
        newDateUTC = UTCdate;

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
        reservation.reservationDate = newDateUTC;
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