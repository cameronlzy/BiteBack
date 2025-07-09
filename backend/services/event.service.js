import _ from 'lodash';
import { DateTime } from 'luxon';
import Event from '../models/event.model.js';
import Reservation from '../models/reservation.model.js';
import { error, success } from '../helpers/response.js';

export async function getAllEvents(query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const [events, total] = await Promise.all([
        Event.find({ endDate: { $gt: now }}).skip(skip).limit(limit).lean(),
        Event.countDocuments({ endDate: { $gt: now }}),
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

export async function getEventsByRestaurant(restaurant, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const [events, total] = await Promise.all([
        Event.find({ restaurant, endDate: { $gt: now }}).skip(skip).limit(limit).lean(),
        Event.countDocuments({ restaurant, endDate: { $gt: now }}),
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
    const event = new Event(_.pick(data, ['restaurant', 'title', 'description', 'startDate', 'endDate', 'paxLimit', 'remarks']));
    await event.save();
    return success(event);
}

export async function updateEvent(event, restaurant, update) {
    if (event.endDate < new Date()) {
        return error(400, 'Event has expired');
    }

    for (const key in update) {
        if (key === 'startDate') {
            if (event.startDate < new Date()) {
                return error(400, 'Event has already started');
            }
            event.startDate = DateTime.fromISO(update.startDate, { zone: restaurant.timezone }).toUTC().toJSDate();
        } else if (key === 'endDate') {
            event.endDate = DateTime.fromISO(update.endDate, { zone: restaurant.timezone }).toUTC().toJSDate();
        } else if (key === 'paxLimit') {
            const booked = await getBookedPaxForEvent(event._id);
            if (update[key] < booked) {
                return error(400, 'Pax limit must be greater than exisiting reservations');
            }
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
