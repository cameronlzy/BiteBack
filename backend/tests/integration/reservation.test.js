const { Reservation } = require('../../models/reservation');
const { User, createTestUser } = require('../../models/user');
const request = require('supertest');
const mongoose = require('mongoose');
const { Restaurant, createTestRestaurant } = require('../../models/restaurant');
const { DateTime } = require('luxon');
const { OwnerProfile } = require('../../models/ownerProfile');

describe.skip('reservation test', () => {
    let server;

    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('POST /api/reservation', () => {
        let token;
        let user;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let pax;
        let owner;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            token = user.generateAuthToken();

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();

            // create a restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            // setting up a reservation
            reservationDate = DateTime.now().setZone('Asia/Singapore').plus({days:1}).toJSDate(); // SG time
            pax = 10;
        });

        const exec = () => {
            return request(server)
            .post('/api/reservation/')
            .set('x-auth-token', token)
            .send({
                restaurant: restaurantId,
                reservationDate,
                pax
            });
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

        it('should return 400 if invalid date', async () => {
            reservationDate = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if partial date (no time)', async () => {
            reservationDate = reservationDate.toISOString().slice(0, 10);
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if valid request, owner', async () => {
            owner = await createTestUser('owner');
            token = owner.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request, customer', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return 200 if valid request, customer', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('restaurant');
            expect(res.body).toHaveProperty('reservationDate');
            expect(res.body).toHaveProperty('pax');
        });

        it('should return 200 if valid request, owner', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/reservation', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate1;
        let reservationDate2;
        let pax;

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

            // create reservations
            reservationDate1 = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            reservationDate2 = new DateTime(Date.now()).plus({weeks:4}).toJSDate(); // UTC
            pax = 10;
            const reservation1 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate1, pax
            });
            await reservation1.save();
            const reservation2 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate2, pax
            });
            await reservation2.save();
        });

        const exec = () => {
            return request(server)
            .get('/api/reservation/')
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

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return all reservations if valid', async () => {
            const res = await exec();
            expect(res.body.length).toBe(2);
            res.body.forEach(reservation => {
                expect(reservation).toHaveProperty('user');
                expect(reservation).toHaveProperty('restaurant');
                expect(reservation).toHaveProperty('reservationDate');
                expect(reservation).toHaveProperty('pax');
            });
        });

        it('should return empty array if no reservations found', async () => {
            await Reservation.deleteMany({});
            const res = await exec();
            expect(res.body).toEqual([]);
        });
    });

    describe('GET /api/reservation/:id', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let pax;
        let reservationId;

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
            reservationDate = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, pax
            });
            await reservation.save();
            reservationId = reservation._id;
        });

        const exec = () => {
            return request(server)
            .get(`/api/reservation/${reservationId}`)
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
            reservationId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if reservation not found', async () => {
            reservationId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return reservation', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('restaurant');
            expect(res.body).toHaveProperty('reservationDate');
            expect(res.body).toHaveProperty('pax');
        });
    });

    describe('GET /api/reservation/restaurant/:id', () => {
        let token;
        let user;
        let userId;
        let owner;
        let restaurant;
        let restaurantId;
        let reservationDate1;
        let reservationDate2;
        let pax;
        let url;
        let startDate;
        let endDate;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;
            userToken = user.generateAuthToken();

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();
            token = owner.generateAuthToken();

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create reservations (in UTC)
            reservationDate1 = DateTime.now().endOf('day').toUTC().toJSDate();
            reservationDate2 = DateTime.now().plus({ weeks: 4 }).toUTC().toJSDate();
            pax = 10;
            const reservation1 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate1, pax
            });
            await reservation1.save();
            const reservation2 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate2, pax
            });
            await reservation2.save();
            startDate = DateTime.now().setZone('Asia/Singapore').startOf('day').toISODate();
            endDate = new DateTime(Date.now()).setZone('Asia/Singapore').plus({weeks:5}).toISODate();
            url = `/api/reservation/restaurant/${restaurantId}?startDate=${startDate}&endDate=${endDate}`;
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

        it('should return 400 if no startDate', async () => {
            url = `/api/reservation/restaurant/${restaurantId}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid startDate', async () => {
            url = `/api/reservation/restaurant/${restaurantId}?startDate=1`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if customer', async () => {
            token = userToken;
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid Id', async () => {
            restaurantId = 1;
            url = `/api/reservation/restaurant/${restaurantId}?startDate=${startDate}&endDate=${endDate}`;
            const res = await exec(); 
            expect(res.status).toBe(400);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            url = `/api/reservation/restaurant/${restaurantId}?startDate=${startDate}&endDate=${endDate}`;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return 200 if valid token with no endDate', async () => {
            url = `/api/reservation/restaurant/${restaurantId}?startDate=${startDate}`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

        it('should return all reservations', async () => {
            const res = await exec();
            res.body.forEach(reservation => {
                expect(reservation).toHaveProperty('user');
                expect(reservation).toHaveProperty('restaurant');
                expect(reservation).toHaveProperty('reservationDate');
                expect(reservation).toHaveProperty('pax');
            });
        });
    });

    describe('GET /api/reservation/restaurant/avail/:id', () => {
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
            url = `/api/reservation/restaurant/avail/${restaurantId}?date=${queryDateSG}`;
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
            url = '/api/reservation/restaurant/avail/1'
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if no date query', async () => {
            url = `/api/reservation/restaurant/avail/${restaurant._id}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid date', async () => {
            url = `/api/reservation/restaurant/avail/${restaurant._id}?date=1`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if no restaurant found', async () => {
            url = `/api/reservation/restaurant/avail/${user._id}?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token, restaurant closed', async () => {
            const sunday = DateTime.fromISO('2025-05-18').setZone('Asia/Singapore').toISODate();
            url = `/api/reservation/restaurant/avail/${restaurant._id}?date=${sunday}`;
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

    describe('PUT /api/reservation/:id', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let pax;
        let reservationId;
        let newReservationDate;
        let newPax;

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
            reservationDate = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, pax
            });
            await reservation.save();
            reservationId = reservation._id;
            newPax = 5;
            newReservationDate = new DateTime(Date.now()).plus({days:15}).setZone('Asia/Singapore').toJSDate(); // SGT
        });

        const exec = () => {
            return request(server)
            .put(`/api/reservation/${reservationId}`)
            .set('x-auth-token', token)
            .send({
                newReservationDate, newPax
            });
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
            reservationId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid request', async () => {
            newReservationDate = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if reservation not found', async () => {
            reservationId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if reservation does not belong to user', async () => {
            let otherUser = await createTestUser('customer');
            token = otherUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated reservation', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/reservation/:id', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let pax;
        let reservationId;

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
            reservationDate = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, pax
            });
            await reservation.save();
            reservationId = reservation._id;
        });

        const exec = () => {
            return request(server)
            .delete(`/api/reservation/${reservationId}`)
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
            reservationId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if reservation not found', async () => {
            reservationId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if reservation does not belong to user', async () => {
            let otherUser = await createTestUser('customer');
            token = otherUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return deleted reservation', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });
    });
});
