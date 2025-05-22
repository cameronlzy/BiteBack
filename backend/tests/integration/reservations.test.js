const { Reservation } = require('../../models/reservation');
const { User, createTestUser } = require('../../models/user');
const request = require('supertest');
const mongoose = require('mongoose');
const { Restaurant, createTestRestaurant } = require('../../models/restaurant');
const { DateTime } = require('luxon');
const { OwnerProfile } = require('../../models/ownerProfile');
const c = require('config');
const { create } = require('lodash');

describe.skip('reservation test', () => {
    let server;

    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/reservations/owner', () => {
        let token;
        let userId;
        let owner;
        let reservationDates;
        let reservations;
        let restaurants;
        let url;
        let startDate;
        let endDate;

        beforeEach(async () => {
            await User.deleteMany({});
            await Reservation.deleteMany({});
            await Restaurant.deleteMany({});

            // create a user
            userId = new mongoose.Types.ObjectId();

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();
            token = owner.generateAuthToken();

            // create 3 restaurants
            let restaurant1 = await createTestRestaurant(owner._id);
            await restaurant1.save();
            let restaurant2 = await createTestRestaurant(owner._id);
            await restaurant2.save();
            let restaurant3 = await createTestRestaurant(owner._id);
            await restaurant3.save();

            restaurants = [
                restaurant1._id, restaurant2._id, restaurant3._id,
            ];

            // create 3 reservations (in UTC)
            reservationDates = [
                DateTime.now().endOf('day').toUTC().toJSDate(),
                DateTime.now().plus({ weeks: 1 }).toUTC().toJSDate(),
                DateTime.now().plus({ weeks: 5 }).toUTC().toJSDate(),
            ];
            reservations = [];
            for (let step = 0; step < 3; step++) {
                let reservation = new Reservation({
                    user: userId, restaurant: restaurants[step],
                    reservationDate: reservationDates[step], pax: step + 1
                });
                await reservation.save();
                reservations.push(reservation);
            }

            startDate = DateTime.now().setZone('Asia/Singapore').startOf('day').toISODate();
            endDate = new DateTime(Date.now()).setZone('Asia/Singapore').plus({weeks:2}).toISODate();
            url = `/api/reservations/owner?startDate=${startDate}&endDate=${endDate}`;
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
            url = `/api/reservations/owner`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = customer.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid startDate', async () => {
            url = `/api/reservations/owner?startDate=1&endDate=${endDate}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it('should return 200 if valid token with no endDate', async () => {
            url = `/api/reservations/owner?startDate=${startDate}`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
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

    describe('GET /api/reservations/restaurant/:id', () => {
        let token;
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
            userId = new mongoose.Types.ObjectId();

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();
            token = owner.generateAuthToken();

            // create a restaurant
            restaurant = createTestRestaurant(owner._id);
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
            endDate = new DateTime(Date.now()).setZone('Asia/Singapore').plus({weeks:2}).toISODate();
            url = `/api/reservations/restaurant/${restaurantId}?startDate=${startDate}&endDate=${endDate}`;
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
            url = `/api/reservations/restaurant/${restaurantId}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid startDate', async () => {
            url = `/api/reservations/restaurant/${restaurantId}?startDate=1&endDate=${endDate}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = customer.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid Id', async () => {
            restaurantId = 1;
            url = `/api/reservations/restaurant/${restaurantId}?startDate=${startDate}&endDate=${endDate}`;
            const res = await exec(); 
            expect(res.status).toBe(400);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            url = `/api/reservations/restaurant/${restaurantId}?startDate=${startDate}&endDate=${endDate}`;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if restaurant not owned by owner', async () => {
            let anotherOwner = await createTestUser('owner');
            token = anotherOwner.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

        it('should return 200 if valid token with no endDate', async () => {
            url = `/api/reservations/restaurant/${restaurantId}?startDate=${startDate}`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
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

    describe('GET /api/reservations', () => {
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
            .get('/api/reservations/')
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

    describe('POST /api/reservations', () => {
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
            .post('/api/reservations/')
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

    describe('GET /api/reservations/:id', () => {
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
            .get(`/api/reservations/${reservationId}`)
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

    describe('PUT /api/reservations/:id', () => {
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
            .put(`/api/reservations/${reservationId}`)
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
            expect(res.body).toHaveProperty('restaurant');
            expect(res.body).toHaveProperty('reservationDate');
            expect(res.body).toHaveProperty('pax');
        });
    });

    describe('DELETE /api/reservations/:id', () => {
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
            .delete(`/api/reservations/${reservationId}`)
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
            expect(res.body).toHaveProperty('restaurant');
            expect(res.body).toHaveProperty('reservationDate');
            expect(res.body).toHaveProperty('pax');
        });
    });
});
