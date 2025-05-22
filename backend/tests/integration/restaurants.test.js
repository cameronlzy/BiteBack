const { Reservation } = require('../../models/reservation');
const { User, createTestUser } = require('../../models/user');
const request = require('supertest');
const mongoose = require('mongoose');
const { Restaurant, createTestRestaurant } = require('../../models/restaurant');
const { DateTime } = require('luxon');

describe.skip('reservation test', () => {
    let server;

    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/restaurants/:id/availability', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let queryDateSG;
        let pax;
        let url;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;
            token = user.generateAuthToken();

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservationDate = new Date('2025-05-17T11:00'); // UTC date
            queryDateSG = DateTime.fromJSDate(reservationDate, { zone: 'utc' }).setZone('Asia/Singapore').toISODate(); // SG date
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, pax
            });
            await reservation.save();

            // create url
            url = `/api/restaurants/${restaurantId}/availability?date=${queryDateSG}`;
        });

        const exec = () => {
            return request(server)
            .get(url)
            .set('x-auth-token', token);
        };

        it('should return 401 if no token', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            token = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid id', async () => {
            url = `/api/restaurants/1/availability?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if no date query', async () => {
            url = `/api/restaurants/${restaurantId}/availability`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid date', async () => {
            url = `/api/restaurants/${restaurantId}/availability?date=1`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if no restaurant found', async () => {
            url = `/api/restaurants/${user._id}/availability?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token, restaurant closed', async () => {
            const sunday = DateTime.fromISO('2025-05-18').setZone('Asia/Singapore').toISODate();
            url = `/api/restaurants/${restaurantId}/availability?date=${sunday}`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toBe(-1);
        });

        it('should return 200 if valid token, restaurant not closed', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return an array of availability', async () => {
            const res = await exec();
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(slot => {
                expect(slot).toHaveProperty('time');
                expect(typeof slot.time).toBe('string');
                expect(slot.time).toMatch(/^\d{2}:\d{2}$/);

                expect(slot).toHaveProperty('available');
                expect(typeof slot.available).toBe('number');
                expect(slot.available).toBeGreaterThanOrEqual(0);
            });
        });
    });
});