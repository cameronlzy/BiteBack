const { createSlots } = require('../../../helpers/restaurant.helper');
const { DateTime } = require('luxon');

describe('restaurant helper tests', () => {
    it('should return an array of time intervals of the right length', () => {
        let restaurant = {
            openingHours: "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x",
            slotDuration: 60
        };
        let sunday = DateTime.fromISO('2025-05-17', { zone: 'Asia/Singapore' });
        let output = createSlots(restaurant.openingHours, sunday, restaurant.slotDuration);
        expect(createSlots(restaurant.openingHours, sunday)).toEqual(expect.arrayContaining(['10:00', '11:00', '12:00', '13:00']));
        expect(output.length).toBe(4);
    });

    it('should return empty array if closed', () => {
        let restaurant = {
            openingHours: "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x",
            slotDuration: 60
        };
        const date = DateTime.fromISO('2025-05-18', { zone: 'Asia/Singapore' }); // Sunday
        const result = createSlots(restaurant.openingHours, date, restaurant.slotDuration);
        expect(result).toEqual([]);
    });
});
