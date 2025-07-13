import _ from 'lodash';
import { DateTime } from 'luxon';
import Event from '../models/event.model.js';
import Reservation from '../models/reservation.model.js';
import Restaurant from '../models/restaurant.model.js';
import { deleteImagesFromDocument } from '../services/image.service.js';
import { error, success } from '../helpers/response.js';

export async function getAllPublicEvents(query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const [events, total] = await Promise.all([
        Event.find({ endDate: { $gt: now }, minVisits: 0, status: 'scheduled' }).sort({ startDate: 1 }).skip(skip).limit(limit).lean(),
        Event.countDocuments({ endDate: { $gt: now }, minVisits: 0, status: 'scheduled' }),
    ]);

    const eventsWithPax = await Promise.all(events.map(async e => {
        const reservedPax = await getBookedPaxForEvent(e._id)
        return { ...e, reservedPax }
    }));

    return success({
        events: eventsWithPax,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getEventsByOwner(authUser, query) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const now = new Date();
    const restaurants = await Restaurant.find({ owner: authUser.profile }).lean();
    const restaurantIds = restaurants.map(r => r._id);
    const baseFilter = { restaurant: { $in: restaurantIds } };

    if (status === 'past') {
        baseFilter.endDate = { $lt: now };
    } else if (status === 'upcoming') {
        baseFilter.endDate = { $gte: now };
    }

    let pipeline = [
        { $match: baseFilter },
    ];

    if (status === 'upcoming') {
        pipeline.push({
            $addFields: {
                statusPriority: {
                    $cond: [{ $eq: ['$status', 'scheduled'] }, 0, { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 2]}]
                }
            }
        });

        pipeline.push({ $sort: { statusPriority: 1, startDate: 1 } });
    } else if (status === 'past') {
        pipeline.push({ $sort: { startDate: 1 } });
    }

    pipeline.push({ $skip: skip }, { $limit: limit }, { $project: { statusPriority: 0 } });

    const [events, total] = await Promise.all([
        Event.aggregate(pipeline),
        Event.countDocuments(baseFilter),
    ]);

    const eventsWithPax = await Promise.all(events.map(async e => {
        const reservedPax = await getBookedPaxForEvent(e._id)
        return { ...e, reservedPax }
    }));

    return success({
        events: eventsWithPax,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
    });
}

export async function getPrivateEventsByRestaurant(restaurant, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const [events, total] = await Promise.all([
        Event.find({ restaurant, endDate: { $gt: now }, minVisits: { $gt: 0 }, status: 'scheduled' }).sort({ startDate: 1 }).skip(skip).limit(limit).lean(),
        Event.countDocuments({ restaurant, endDate: { $gt: now }, minVisits: { $gt: 0 }, status: 'scheduled' }),
    ]);

    const eventsWithPax = await Promise.all(events.map(async e => {
        const reservedPax = await getBookedPaxForEvent(e._id)
        return { ...e, reservedPax }
    }));

    return success({
        events: eventsWithPax,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getEventById(eventId) {
    const event = await Event.findById(eventId).lean();
    if (!event) return error(404, 'Event not found');
    if (event.endDate < new Date()) return error(404, 'Event expired');
    event.reservedPax = await getBookedPaxForEvent(event._id);
    return success(event);
}

export async function createEvent(data) {
    const restaurant = await Restaurant.findById(data.restaurant).select('timezone slotDuration maxCapacity').lean();
    if (!restaurant) return error(404, 'Restaurant not found');

    const slotStart = DateTime.fromISO(data.startDate, { zone: restaurant.timezone }).toUTC();
    const slotEnd = DateTime.fromISO(data.endDate, { zone: restaurant.timezone }).toUTC();
    const slotDuration = restaurant.slotDuration;

    const eventSlots = [];
    for (let dt = slotStart; dt < slotEnd; dt = dt.plus({ minutes: slotDuration })) {
        eventSlots.push(dt);
    }

    const [reservations, overlappingEvents] = await Promise.all([
        Reservation.find({
            restaurant: restaurant._id,
            startDate: { $lt: slotEnd.toJSDate() },
            endDate: { $gt: slotStart.toJSDate() }
        }).select('startDate endDate pax event').lean(),

        Event.find({
            restaurant: restaurant._id,
            startDate: { $lt: slotEnd.toJSDate() },
            endDate: { $gt: slotStart.toJSDate() }
        }).select('slotPax startDate endDate').lean()
    ]);

    let minAvailable = Infinity;
    for (const slot of eventSlots) {
        const slotEndTime = slot.plus({ minutes: slotDuration });

        let regularPax = 0;
        for (const r of reservations) {
            if (r.event) continue;
            const rStart = DateTime.fromJSDate(r.startDate);
            const rEnd = DateTime.fromJSDate(r.endDate);
            if (rStart < slotEndTime && rEnd > slot) {
                regularPax += r.pax;
            }
        }

        let eventPax = 0;
        for (const e of overlappingEvents) {
            const eStart = DateTime.fromJSDate(e.startDate);
            const eEnd = DateTime.fromJSDate(e.endDate);
            if (eStart < slotEndTime && eEnd > slot) {
                eventPax += e.slotPax;
            }
        }

        const remaining = restaurant.maxCapacity - regularPax - eventPax;
        minAvailable = Math.min(minAvailable, remaining);
    }

    if (data.slotPax > minAvailable) {
        return error(400, 'Not enough capacity for this event');
    }

    const fields = _.pick(data, ['restaurant', 'title', 'description', 'paxLimit', 'slotPax']);
    fields.startDate = slotStart;
    fields.endDate = slotEnd;
    if (data.remarks) fields.remarks = data.remarks;
    if (data.minVisits) fields.minVisits = data.minVisits;
    if (data.maxPaxPerCustomer) fields.maxPaxPerCustomer = data.maxPaxPerCustomer;

    const event = new Event(fields);
    await event.save();
    return success(event);
}

export async function updateEvent(event, restaurant, update) {
    if (event.endDate < new Date()) {
        return error(400, 'Event has expired');
    }

    for (const key in update) {
        if (key === 'paxLimit' || key === 'slotPax') {
            const booked = await getBookedPaxForEvent(event._id);
            if (update[key] < booked) {
                return error(400, `${key} must be greater than exisiting reservations`);
            } 
            if (key === 'slotPax' && update[key] > restaurant.maxCapacity) {
                return error(400, 'Slot Pax cannot be greater than restaurant max capacity');
            }
            event[key] = update[key];
        } else if (key === 'status') {
            const newStatus = update[key];

            if (event.startDate <= new Date()) {
                return error(400, 'Cannot change status after event has started');
            }

            if (newStatus === 'cancelled') {
                await Reservation.updateMany(
                    { event: event._id },
                    { $set: { status: 'cancelled' } }
                );
            }

            if (newStatus === 'scheduled') {
                await Reservation.updateMany(
                    {
                        event: event._id,
                        status: 'cancelled',
                    },
                    { $set: { status: 'booked' } }
                );
            }

            event.status = newStatus;
        } else if (update[key] !== undefined) {
            event[key] = update[key];
        }
    }

    await event.save();
    return success(event.toObject());
}

export async function deleteEvent(event) {
    if (event.startDate < new Date()) {
        return error(400, 'Event has started');
    }
    if (event.endDate < new Date()) {
        return error(400, 'Event has expired');
    }

    await Promise.all([
        deleteImagesFromDocument(event, 'bannerImage'),
        deleteImagesFromDocument(event, 'mainImage'),
    ]);

    const deletedEvent = event.toObject();
    await event.deleteOne();
    return success(deletedEvent);
}

// helper services
export async function getBookedPaxForEvent(eventId) {
    const result = await Reservation.aggregate([
        { $match: { event: eventId, status: 'booked' } },
        { $group: { _id: null, totalPax: { $sum: '$pax' } } }
    ])
    return result[0]?.totalPax || 0
}
