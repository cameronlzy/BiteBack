import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import Reservation from '../../models/reservation.model.js';

export function createTestReservation({ 
    customer = new mongoose.Types.ObjectId(), 
    restaurant = new mongoose.Types.ObjectId(), 
    event = undefined,
} = {}) {
    const startDate = DateTime.utc().plus({ days: 3 }).toJSDate();
    const endDate = DateTime.fromJSDate(startDate).plus({ hours: 1 }).toJSDate();
    const pax = 3;

    const reservation = new Reservation({
        customer,
        restaurant,
        startDate,
        endDate,
        pax,
        event,
    });
    return reservation;
}