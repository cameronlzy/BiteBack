import mongoose from 'mongoose';
import Event from '../../models/event.model.js';
import { DateTime } from 'luxon';

export function createTestEvent({ 
    restaurant = new mongoose.Types.ObjectId(), 
    startDate = DateTime.now().minus({ days: 3 }).toJSDate(),
    endDate = DateTime.now().plus({ days: 3 }).toJSDate() 
} = {}) {
    const title = 'title';
    const description = 'description';
    const paxLimit = 10;
    const slotPax = 10;

    const event = new Event({
        restaurant, title, description, paxLimit, slotPax, startDate, endDate
    });
    return event;
}