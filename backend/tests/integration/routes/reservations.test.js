import Reservation from '../../../models/reservation.model.js';
import User from '../../../models/user.model.js';
import request from 'supertest';
import mongoose from 'mongoose';
import Restaurant from '../../../models/restaurant.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { DateTime } from 'luxon';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';

describe('reservation test', () => {
    let server;

    beforeAll(async () => {
        const mod = await import('../../../index.js');
        server = mod.default;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
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
        let staff;
        let remarks;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            userId = new mongoose.Types.ObjectId();

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();           

            // create a restaurant
            restaurant = createTestRestaurant(owner._id);
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token); 

            restaurantId = restaurant._id;

            // create reservations (in UTC)
            reservationDate1 = DateTime.now().toJSDate();
            reservationDate2 = DateTime.now().plus({ minute: restaurant.slotDuration }).toJSDate();
            remarks = '';
            pax = 10;
            const reservation1 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate1, remarks, pax
            });
            await reservation1.save();
            const reservation2 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate2, remarks, pax
            });
            await reservation2.save();
        });

        const exec = () => {
            return request(server)
            .get(`/api/reservations/restaurant/${restaurantId}`)
            .set('Cookie', [cookie]);
        };

        it('should return 400 if invalid ID', async () => {
            restaurantId = "invalid";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if not staff', async () => {
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if staff not from restaurant', async () => {
            let anotherStaff = await createTestStaff();
            token = generateAuthToken(anotherStaff);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it.skip('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

        it.skip('should return all reservations', async () => {
            const res = await exec();
            res.body.forEach(reservation => {
                expect(reservation).toHaveProperty('user');
                expect(reservation).toHaveProperty('restaurant');
                expect(reservation).toHaveProperty('reservationDate');
                expect(reservation).toHaveProperty('remarks');
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
        let remarks;
        let pax;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create reservations
            reservationDate1 = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            reservationDate2 = new DateTime(Date.now()).plus({weeks:4}).toJSDate(); // UTC
            remarks = '';
            pax = 10;
            const reservation1 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate1, remarks, pax
            });
            await reservation1.save();
            const reservation2 = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate: reservationDate2, remarks, pax
            });
            await reservation2.save();
        });

        const exec = () => {
            return request(server)
            .get('/api/reservations/')
            .set('Cookie', [cookie]);
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
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
                expect(reservation).toHaveProperty('remarks');
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
        let remarks;
        let pax;
        let owner;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();

            // create a restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            // setting up a reservation
            reservationDate = DateTime.now().setZone('Asia/Singapore').plus({days:1}).toJSDate(); // SG time
            remarks = '';
            pax = 10;
        });

        const exec = () => {
            return request(server)
            .post('/api/reservations/')
            .set('Cookie', [cookie])
            .send({
                restaurant: restaurantId,
                reservationDate, remarks,
                pax
            });
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
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
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request, customer', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return 200 if valid request, customer', async () => {
            const res = await exec();
            const requiredKeys = [
                'user', 'restaurant', 'reservationDate', 'remarks', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
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
        let remarks;
        let pax;
        let reservationId;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservationDate = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            remarks = '';
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
            .set('Cookie', [cookie])
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
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
            const requiredKeys = [
                'user', 'restaurant', 'reservationDate', 'remarks', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });    

    describe('PATCH /api/reservations/:id', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let remarks;
        let pax;
        let reservationId;
        let newReservationDate;
        let newRemarks;
        let newPax;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservationDate = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            remarks = '';
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId, remarks,
                reservationDate, pax
            });
            await reservation.save();
            reservationId = reservation._id;
            newReservationDate = new DateTime(Date.now()).plus({days:15}).setZone('Asia/Singapore').toJSDate(); // SGT
            newRemarks = '';
            newPax = 5;
        });

        const exec = () => {
            return request(server)
            .patch(`/api/reservations/${reservationId}`)
            .set('Cookie', [cookie])
            .send({
                reservationDate: newReservationDate, 
                remarks: newRemarks,
                pax: newPax
            });
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
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
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated reservation', async () => {
            const res = await exec();
            const requiredKeys = [
                'user', 'restaurant', 'reservationDate', 'remarks', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('DELETE /api/reservations/:id', () => {
        let token;
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let remarks;
        let pax;
        let reservationId;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservationDate = new DateTime(Date.now()).plus({days:20}).toJSDate(); // UTC
            remarks = '';
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, remarks, pax
            });
            await reservation.save();
            reservationId = reservation._id;
        });

        const exec = () => {
            return request(server)
            .delete(`/api/reservations/${reservationId}`)
            .set('Cookie', [cookie]);
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
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
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            
            const requiredKeys = [
                'user', 'restaurant', 'reservationDate', 'remarks', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));

            const reservationInDb = await Reservation.findById(res.body._id);
            expect(reservationInDb).toBeNull();
        });
    });
});
