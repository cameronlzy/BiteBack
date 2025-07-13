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
        Reservation.find({ customer: profile, endDate: { $gt: now }}).sort({ startDate: 1 }).populate('event', '_id title').skip(skip).limit(limit).lean(),
        Reservation.countDocuments({ customer: profile, endDate: { $gt: now } }),
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
        const event = await Event.findById(reservation.event).select('_id title').lean();
        reservation.event = event;
    }
    return success(reservation.toObject());
}

export async function createReservation(authUser, data) {
    return await withTransaction(async (session) => {
        if (data.event) {
            const alreadyBooked = await Reservation.exists({ customer: authUser.profile, event: data.event }).session(session);
            if (alreadyBooked) return error(400, 'Customer already joined this event');
        }

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

        const [overlappingReservations, overlappingEvents] = await Promise.all([
            Reservation.find({
                restaurant: restaurant._id,
                startDate: { $lt: slotEnd.toJSDate() },
                endDate: { $gt: slotStart.toJSDate() }
            }).select('pax event').session(session).lean(),
            Event.find({
                restaurant: restaurant._id,
                startDate: { $lt: slotEnd.toJSDate() },
                endDate: { $gt: slotStart.toJSDate() }
            }).select('slotPax').session(session).lean(),
        ]);

        let bookedRegularPax = 0;
        let bookedEventPax = 0;

        overlappingReservations.forEach(r => {
            if (!r.event) {
                bookedRegularPax += r.pax;
            } else if (data.event && r.event.toString() === data.event.toString()) {
                bookedEventPax += r.pax;
            }
        });

        const totalEventSlotPax = overlappingEvents.reduce((sum, e) => sum + e.slotPax, 0);

        if (!data.event) {
            const remainingCapacity = restaurant.maxCapacity - totalEventSlotPax;
            if (bookedRegularPax + data.pax > remainingCapacity) {
                return error(409, 'Restaurant is fully booked at this time slot');
            }
        } else {
            if (bookedEventPax + data.pax > event.paxLimit) {
                return error(409, 'Event is fully booked');
            }
        }

        // create reservation
        const reservation = new Reservation({
            customer: authUser.profile,
            restaurant: restaurant._id,
            startDate: slotStart.toJSDate(),
            pax: data.pax,
        });
        if (data.remarks) reservation.remarks = data.remarks;

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
    if (reservation.event) {
        return error(400, 'Cannot edit event reservation');
    }

    const isDateChanging = update.startDate !== undefined;
    const isPaxChanging = update.pax !== undefined;
    let newDateUTC, slotDuration;

    if (isDateChanging || isPaxChanging) {
        const newDate = isDateChanging ? update.startDate : reservation.startDate.toISOString();
        const newPax = isPaxChanging ? update.pax : reservation.pax;
        const restaurant = await Restaurant.findById(reservation.restaurant).select('+maxCapacity +slotDuration +timezone').lean();
        slotDuration = restaurant.slotDuration;

        const slotStart = DateTime.fromISO(newDate, { zone: restaurant.timezone }).toUTC();
        const slotEnd = slotStart.plus({ minutes: slotDuration });
        newDateUTC = slotStart;

        const [overlappingReservations, overlappingEvents] = await Promise.all([
            Reservation.find({
                restaurant: restaurant._id,
                startDate: { $lt: slotEnd.toJSDate() },
                endDate: { $gt: slotStart.toJSDate() }
            }).select('pax event').lean(),
            Event.find({
                restaurant: restaurant._id,
                startDate: { $lt: slotEnd.toJSDate() },
                endDate: { $gt: slotStart.toJSDate() }
            }).select('slotPax').lean(),
        ]);

        let bookedPax = 0;
        overlappingReservations.forEach(r => {
            if (!r._id.equals(reservation._id) && !r.event) {
                bookedPax += r.pax;
            }
        });

        const totalEventSlotPax = overlappingEvents.reduce((sum, e) => sum + e.slotPax, 0);
        const remainingCapacity = restaurant.maxCapacity - totalEventSlotPax;

        if (bookedPax + newPax > remainingCapacity) {
            return error(409, 'Restaurant is fully booked at this time slot');
        }
    }

    if (update.startDate !== undefined) {
        reservation.startDate = newDateUTC.toJSDate();
        reservation.endDate = newDateUTC.plus({ minutes: slotDuration }).toJSDate();
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
        if (event.startDate < new Date()) {
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