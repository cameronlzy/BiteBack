import Reservation from '../models/reservation.model.js';
import Restaurant from '../models/restaurant.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import VisitHistory from '../models/visitHistory.model.js';
import Event from '../models/event.model.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import { addVisitToHistory } from './visitHistory.service.js';
import { adjustPoints } from './rewardPoint.service.js';
import { error, success } from '../helpers/response.js';
import { withTransaction, wrapSession } from '../helpers/transaction.helper.js';

export async function getReservationsByCustomer(profile, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const now = new Date();

    const [reservations, total] = await Promise.all([
        Reservation.find({ customer: profile, startDate: { $gte: now }}).sort({ startDate: 1 }).skip(skip).limit(limit).lean(),
        Reservation.countDocuments({ customer: profile, startDate: { $gte: now } }),
    ]);

    return success({
        reservations,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getReservationById(reservation) {
    // check if expired
    if (reservation.endDate < new Date()) {
        return error(400, 'Reservation expired');
    }
    if (reservation.event) {
        const event = await Event.findById(reservation.event).select('title').lean();
        reservation.event = event;
    }
    return success(reservation.toObject());
}

export async function createReservation(authUser, data) {
    return await withTransaction(async (session) => {
        // get restaurant
        const restaurant = await Restaurant.findById(data.restaurant).session(session).lean();
        if (!restaurant) return error(404, 'Restaurant not found');

        let event;
        if (data.event) {
            event = await Event.findById(data.event).select('minVisits restaurant endDate').session(session).lean();
            if (!event || String(event.restaurant) !== String(restaurant._id)) {
                return error(400, 'Invalid event');
            }
            const result = await VisitHistory.aggregate([
                {
                    $match: {
                        customer: new mongoose.Types.ObjectId(authUser.profile),
                        restaurant: new mongoose.Types.ObjectId(restaurant._id)
                    }
                },
                {
                    $project: {
                        visitCount: { $size: '$visits' }
                    }
                }
            ]).session(session);

            const visitCount = result[0]?.visitCount ?? 0;
            if (visitCount < event.minVisits) {
                return error(400, `Customer must have at least ${event.minVisits} visits to reserve this event`);
            }
        }

        // check availability
        const slotStart = DateTime.fromISO(data.startDate, { zone: restaurant.timezone }).toUTC();
        const slotEnd = slotStart.plus({ minutes: restaurant.slotDuration });

        const overlappingReservations = await Reservation.find({
            restaurant: restaurant._id,
            startDate: { $lt: slotEnd.toJSDate() },
            endDate: { $gt: slotStart.toJSDate() }
        }).select('pax event').session(session).lean();

        let bookedPax = 0;
        let bookedPaxForEvent = 0;

        overlappingReservations.forEach(({ pax, event: reservationEvent }) => {
            bookedPax += pax;
            if (data.event && reservationEvent?.toString() === data.event.toString()) {
                bookedPaxForEvent += pax;
            }
        });

        if (bookedPax + data.pax > restaurant.maxCapacity) {
            return error(409, 'Restaurant is fully booked at this time slot');
        }

        if (data.event && bookedPaxForEvent + data.pax > event.paxLimit) {
            return error(409, 'Event is fully booked');
        }

        // create reservation
        const reservation = new Reservation({
            customer: authUser.profile,
            restaurant: restaurant._id,
            startDate: slotStart.toJSDate(),
            remarks: data.remarks,
            pax: data.pax,
        });
        if (data.event) {
            reservation.event = data.event;
            reservation.endDate = DateTime.fromJSDate(event.endDate).toJSDate();
        } else {
            reservation.endDate = slotEnd.toJSDate();
        }
        await reservation.save(wrapSession(session));
        return success(reservation.toObject());
    });
}

export async function updateReservationStatus(reservation, status) {
    return await withTransaction(async (session) => {
        reservation.status = status;
        await reservation.save(wrapSession(session));

        if (status === 'completed') {
            const customer = await CustomerProfile.findById(reservation.customer).session(session).lean();
            await addVisitToHistory(customer, reservation.restaurant._id, reservation.startDate, session);
            await adjustPoints(100, reservation.restaurant._id, customer, session);
        }
        reservation.restaurant = reservation.restaurant._id;
        return success(reservation.toObject());
    });
}

export async function updateReservation(reservation, update) {
    if (reservation.endDate < new Date()) {
        return error(400, 'Reservation expired');
    }
    const isDateChanging = update.startDate !== undefined;
    const isPaxChanging = update.pax !== undefined;
    let newDateUTC;

    if (isDateChanging || isPaxChanging) {
        const newDate = isDateChanging ? update.startDate : reservation.startDate.toISOString();
        const newPax = isPaxChanging ? update.pax : reservation.pax;
        const restaurant = await Restaurant.findById(reservation.restaurant).select('+maxCapacity +slotDuration +timezone').lean();

        const date = DateTime.fromISO(newDate, { zone: restaurant.timezone });
        const UTCdate = date.toUTC();
        newDateUTC = UTCdate;

        const currentReservations = await Reservation.find({
            restaurant: restaurant._id,
            startDate: {
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

    if (update.startDate !== undefined) {
        reservation.startDate = newDateUTC;
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
    if (reservation.endDate < new Date()) {
        return error(400, 'Reservation expired');
    }
    if (reservation.event) {
        const event = await Event.findById(reservation.event).select('startDate').lean();
        if (event.startDate > new Date()) {
            return error(400, 'Event has started');
        }
    }
    // delete reservation
    await Reservation.deleteOne({ _id: reservation._id });
    return success(reservation.toObject());
}

// helper service
export async function getReservationsByRestaurantByDate(restaurant, date) {
    // convert date
    const restDate = DateTime.fromISO(date, { zone: restaurant.timezone });
    const [utcStart, utcEnd] = [restDate.startOf('day').toUTC().toJSDate(), restDate.endOf('day').toUTC().toJSDate()];

    // find reservations by restaurant by date
    const reservations = await Reservation.find({
        restaurant: restaurant._id, 
        startDate: { $lt: utcEnd },
        endDate: { $gt: utcStart } 
    }).select({ startDate: 1, endDate: 1, pax: 1 }).lean();

    return reservations;
}