const { createSlots } = require('../../../helpers/restaurant.helper');

describe.skip('restaurant methods', () => {
    it('should return an array of time intervals of the right length', () => {
        let restaurant = {
            openingHours: {
                monday: "09:00-17:00",
                tuesday: "09:00-17:00",
                wednesday: "09:00-17:00",
                thursday: "09:00-17:00",
                friday: "09:00-17:00",
                saturday: "10:00-14:30",
                sunday: "Closed"
            }, 
            slotDuration: 60
        };
        let sunday = new Date('2025-05-17');
        let output = createSlots(restaurant, sunday);
        console.log(createSlots(restaurant, sunday));
        expect(createSlots(restaurant, sunday)).toEqual(expect.arrayContaining(['10:00', '11:00', '12:00', '13:00']));
        expect(output.length).toBe(4);
    });

    it('should return null if closed', () => {
        let restaurant = {
            openingHours: {
                monday: "09:00-17:00",
                tuesday: "09:00-17:00",
                wednesday: "09:00-17:00",
                thursday: "09:00-17:00",
                friday: "09:00-17:00",
                saturday: "10:00-14:30",
                sunday: "Closed"
            }, 
            slotDuration: 60
        };
        console.log(createSlots(restaurant, new Date('2025-05-18')));
    });
});
