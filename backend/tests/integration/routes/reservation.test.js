import Reservation from '../../../models/reservation.model.js';
import User from '../../../models/user.model.js';
import request from 'supertest';
import mongoose from 'mongoose';
import Restaurant from '../../../models/restaurant.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { createTestReservation } from '../../factories/reservation.factory.js';
import { createTestEvent } from '../../factories/event.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { DateTime } from 'luxon';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import Staff from '../../../models/staff.model.js';
import VisitHistory from '../../../models/visitHistory.model.js';
import RewardPoint from '../../../models/rewardPoint.model.js';

describe('reservation test', () => {
    let server;

    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/reservations/restaurant/:id', () => {
        let token;
        let owner;
        let restaurant;
        let restaurantId;
        let startDate1;
        let startDate2;
        let staff;
        let cookie;
        let reservation;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create an owner
            owner = await createTestUser('owner');
            await owner.save();           

            // create a restaurant
            restaurant = createTestRestaurant(owner.profile);
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token); 

            restaurantId = restaurant._id;

            // create reservations (in UTC)
            startDate1 = DateTime.utc().toJSDate();
            startDate2 = DateTime.utc().plus({ minute: restaurant.slotDuration }).toJSDate();
            reservation = createTestReservation({ restaurant: restaurantId });
            reservation.startDate = startDate1;
            await reservation.save();

            reservation = createTestReservation({ restaurant: restaurantId });
            reservation.startDate = startDate2;
            await reservation.save();
        });

        const exec = () => {
            return request(server)
            .get(`/api/reservations/restaurant/${restaurantId}`)
            .set('Cookie', [cookie]);
        };

        it.skip('should return 200 if valid token and return all reservations', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            res.body.forEach(reservation => {
                expect(reservation).toHaveProperty('customer');
                expect(reservation).toHaveProperty('restaurant');
                expect(reservation).toHaveProperty('startDate');
                expect(reservation).toHaveProperty('pax');
            });
        });
    });

    describe('GET /api/reservations', () => {
        let token;
        let user;
        let restaurant;
        let restaurantId;
        let startDate1;
        let startDate2;
        let cookie;
        let reservation;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create reservations
            startDate1 = DateTime.utc().plus({days:20}).toJSDate(); // UTC
            startDate2 = DateTime.utc().plus({weeks:4}).toJSDate(); // UTC
            reservation = createTestReservation({ customer: user.profile, restaurant: restaurantId });
            reservation.startDate = startDate1;
            await reservation.save();

            reservation = createTestReservation({ customer: user.profile, restaurant: restaurantId });
            reservation.startDate = startDate2;
            await reservation.save();
        });

        const exec = () => {
            return request(server)
            .get('/api/reservations/')
            .set('Cookie', [cookie]);
        };

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.reservations.length).toBe(2);
            res.body.reservations.forEach(reservation => {
                expect(reservation).toHaveProperty('customer');
                expect(reservation).toHaveProperty('restaurant');
                expect(reservation).toHaveProperty('startDate');
                expect(reservation).toHaveProperty('pax');
            });
        });

        it('should return empty array if no reservations found', async () => {
            await Reservation.deleteMany({});
            const res = await exec();
            expect(res.body.reservations).toEqual([]);
        });
    });

    describe('GET /api/reservations/:id', () => {
        let token;
        let user;
        let restaurant;
        let restaurantId;
        let reservation, reservationId;
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

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservation = createTestReservation({ customer: user.profile, restaurant: restaurantId });
            await reservation.save();
            reservationId = reservation._id;
        });

        const exec = () => {
            return request(server)
            .get(`/api/reservations/${reservationId}`)
            .set('Cookie', [cookie])
        };

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'customer', 'restaurant', 'startDate', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });    

    describe('POST /api/reservations', () => {
        let token;
        let user;
        let restaurant;
        let restaurantId;
        let startDate;
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
            restaurant = createTestRestaurant(owner.profile);
            await restaurant.save();
            restaurantId = restaurant._id;

            // setting up a reservation
            startDate = DateTime.utc().setZone('Asia/Singapore').plus({days:1}).toJSDate(); // SG time
            pax = 10;
        });

        const exec = () => {
            return request(server)
            .post('/api/reservations/')
            .set('Cookie', [cookie])
            .send({
                restaurant: restaurantId,
                startDate,
                pax
            });
        };

        it('should return 400 if invalid date', async () => {
            startDate = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if partial date (no time)', async () => {
            startDate = startDate.toISOString().slice(0, 10);
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if owner', async () => {
            owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 for regular reservation', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'customer', 'restaurant', 'startDate', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.status).toBe('booked');
        });

        it('should return 200 for event reservation', async () => {
            const event = createTestEvent({ customer: user.profile, restaurant: restaurant._id });
            await event.save();
            const res = await request(server)
                .post('/api/reservations/')
                .set('Cookie', [cookie])
                .send({
                    restaurant: restaurantId,
                    startDate,
                    pax, event: event._id
            });
            expect(res.status).toBe(200);
            const requiredKeys = [
                'customer', 'restaurant', 'startDate', 'pax', 'event'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.status).toBe('booked');
        });
    });

    describe('PATCH /api/reservations/:id/status', () => {
        let token;
        let user, profile;
        let restaurant;
        let restaurantId;
        let startDate;
        let reservation, reservationId;
        let cookie;
        let newStatus;
        let staff;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});
            await Staff.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            await user.save();
            await profile.save();

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            await restaurant.save();
            restaurantId = restaurant._id;
            await staff.save();
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token); 

            // create a reservation
            startDate = DateTime.utc().plus({days:20}).toJSDate(); // UTC
            reservation = createTestReservation({ customer: user.profile, restaurant: restaurantId });
            reservation.startDate = startDate;
            await reservation.save();
            reservationId = reservation._id;
            newStatus = 'completed';
        });

        const exec = () => {
            return request(server)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Cookie', [cookie])
            .send({
                status: newStatus,
            });
        };

        it('should return 403 if staff does not belong to reservation restaurant', async () => {
            let otherUser = await createTestUser('customer');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request + updated reservation', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'customer', 'restaurant', 'startDate', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            const visitHistory = await VisitHistory.findOne({ customer: profile._id, restaurant: restaurantId });
            const normalizedDate = new Date(Math.floor(startDate.getTime() / 1000) * 1000);
            expect(visitHistory.visits[0].visitDate).toEqual(normalizedDate);
            const rewardPoint = await RewardPoint.findOne({ customer: profile._id, restaurant: restaurantId });
            expect(rewardPoint.points).toBe(100);
        });
    });

    describe('PATCH /api/reservations/:id', () => {
        let token;
        let user;
        let restaurant;
        let restaurantId;
        let reservation, reservationId;
        let newstartDate;
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
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservation = createTestReservation({ customer: user.profile, restaurant: restaurantId });
            await reservation.save();
            reservationId = reservation._id;
            newstartDate = DateTime.utc().plus({days:15}).setZone('Asia/Singapore').toJSDate(); // SGT
            newRemarks = 'a';
            newPax = 5;
        });

        const exec = () => {
            return request(server)
            .patch(`/api/reservations/${reservationId}`)
            .set('Cookie', [cookie])
            .send({
                startDate: newstartDate, 
                remarks: newRemarks,
                pax: newPax
            });
        };

        it('should return 403 if reservation does not belong to user', async () => {
            let otherUser = await createTestUser('customer');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request + updated reservation', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'customer', 'restaurant', 'startDate', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('DELETE /api/reservations/:id', () => {
        let token;
        let user;
        let restaurant;
        let restaurantId;
        let reservation, reservationId;
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

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservation = createTestReservation({ customer: user.profile, restaurant: restaurantId });
            await reservation.save();
            reservationId = reservation._id;
        });

        const exec = () => {
            return request(server)
            .delete(`/api/reservations/${reservationId}`)
            .set('Cookie', [cookie]);
        };

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            
            const requiredKeys = [
                'customer', 'restaurant', 'startDate', 'pax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));

            const reservationInDb = await Reservation.findById(res.body._id);
            expect(reservationInDb).toBeNull();
        });
    });
});
