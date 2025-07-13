import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import Restaurant from '../../../models/restaurant.model.js';
import Reservation from '../../../models/reservation.model.js';
import Event from '../../../models/event.model.js';
import User from '../../../models/user.model.js';
import OwnerProfile from '../../../models/ownerProfile.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestOwnerProfile } from '../../factories/ownerProfile.factory.js';
import { createTestEvent } from '../../factories/event.factory.js';
import { createTestReservation } from '../../factories/reservation.factory.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('event test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/events', () => {
        let event;

        beforeEach(async () => {
            await Event.deleteMany({});

            event = createTestEvent();
            await event.save();
            event = createTestEvent();
            event.minVisits = 1;
            await event.save();
            // past event
            event = createTestEvent({ 
                startDate: DateTime.now().minus({ weeks: 2 }).toJSDate(), 
                endDate: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            });
            await event.save();
        });

        const exec = () => {
            return request(server)
                .get('/api/events');
        };
        
        it('should return 200 and all events', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.events.forEach(event => {    
                const requiredKeys = [
                    'restaurant',
                    'title',
                    'description',
                    'startDate',
                    'endDate',
                    'paxLimit',
                    'status',
                    'reservedPax'
                ];
                expect(Object.keys(event)).toEqual(expect.arrayContaining(requiredKeys));
            });
            expect(res.body.events.length).toBe(1);
        });
    });

    describe('GET /api/events/owner', () => {
        let restaurants;
        let event;
        let restaurant1, restaurant2;
        let user, profile, token, cookie;

        beforeEach(async () => {
            await Event.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user);
            user.profile = profile._id;
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create 2 restaurant
            restaurant1 = createTestRestaurant(user.profile);
            await restaurant1.save();
            event = createTestEvent({ restaurant: restaurant1._id });
            await event.save();

            restaurant2 = createTestRestaurant(user.profile);
            await restaurant2.save();
            event = createTestEvent({ restaurant: restaurant2._id });
            await event.save();

            restaurants = [restaurant1._id, restaurant2._id];
            profile.restaurants = restaurants;
            await profile.save();
        });

        const exec = () => {
            return request(server)
            .get('/api/events/owner')
            .set('Cookie', [cookie]);
        };

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.events.length).toBe(2);
            res.body.events.forEach(event => {    
                const requiredKeys = [
                    'restaurant',
                    'title',
                    'description',
                    'startDate',
                    'endDate',
                    'paxLimit',
                    'status',
                    'reservedPax'
                ];
                expect(Object.keys(event)).toEqual(expect.arrayContaining(requiredKeys));
            });
        });
    });

    describe('GET /api/events/restaurant/:id', () => {
        let event, restaurant;

        beforeEach(async () => {
            await Event.deleteMany({});

            restaurant = new mongoose.Types.ObjectId();

            event = createTestEvent({ restaurant });
            await event.save();
            event = createTestEvent({ restaurant });
            event.minVisits = 1;
            await event.save();
            // past event not belonging to restaurant
            event = createTestEvent({ 
                startDate: DateTime.now().minus({ weeks: 2 }).toJSDate(), 
                endDate: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            });
            await event.save();
            // past event belonging to restaurant
            event = createTestEvent({ 
                restaurant,
                startDate: DateTime.now().minus({ weeks: 2 }).toJSDate(), 
                endDate: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            });
        });

        const exec = () => {
            return request(server)
                .get(`/api/events/restaurant/${restaurant}`);
        };
        
        it('should return 200 and all events belonging to restaurant', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.events.forEach(event => {    
                const requiredKeys = [
                    'restaurant',
                    'title',
                    'description',
                    'startDate',
                    'endDate',
                    'paxLimit',
                    'status',
                    'reservedPax'
                ];
                expect(Object.keys(event)).toEqual(expect.arrayContaining(requiredKeys));
            });
            expect(res.body.events.length).toBe(1);
        });
    });

    describe('GET /api/events/:id', () => {
        let event, eventId;

        beforeEach(async () => {
            await Event.deleteMany({});

            event = createTestEvent();
            await event.save();
            eventId = event._id;
        });

        const exec = () => {
            return request(server)
                .get(`/api/events/${eventId}`);
        };

        it('should return 404 if no event with ID', async () => {
            eventId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);  
        });

        it('should return 404 if past event', async () => {
            event = createTestEvent({ 
                startDate: DateTime.now().minus({ weeks: 2 }).toJSDate(), 
                endDate: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            });
            await event.save();
            eventId = event._id;
            const res = await exec();
            expect(res.status).toBe(404);  
        });
        
        it('should return 200 and event', async () => {
            const res = await exec();
            expect(res.status).toBe(200);  
            const requiredKeys = [
                'restaurant',
                'title',
                'description',
                'startDate',
                'endDate',
                'paxLimit',
                'status',
                'reservedPax'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/events', () => {
        let event, restaurant;
        let user, token, cookie;
        let title, description, startDate, endDate, paxLimit, slotPax, remarks;

        beforeEach(async () => {
            await Event.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('owner');
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            event = createTestEvent({ restaurant: restaurant._id });
            title = event.title;
            description = event.description;
            startDate = DateTime.now().plus({ hours: 1 }).toJSDate();
            endDate = event.endDate;;
            paxLimit = event.paxLimit;
            slotPax = event.slotPax;
            remarks = event.remarks;
        });

        const exec = () => {
            return request(server)
                .post('/api/events')
                .set('Cookie', [cookie])
                .send({
                    restaurant: restaurant._id, title, description, startDate, endDate, paxLimit, slotPax, remarks
                });
        };
        
        it('should return 200 and event', async () => {
            const res = await exec();
            expect(res.status).toBe(200);  
            const requiredKeys = [
                'restaurant',
                'title',
                'description',
                'startDate',
                'endDate',
                'paxLimit',
                'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/events/:id/images', () => {
        let user, token, cookie;
        let event, eventId;
        let filePath;
        let restaurant;

        beforeEach(async () => {
            await Event.deleteMany({});
            await User.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            // create event
            event = createTestEvent({ restaurant: restaurant._id });
            await event.save();
            eventId = event._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .post(`/api/events/${eventId}/images`)
            .set('Cookie', [cookie])
            .attach('mainImage', filePath)
            .attach('bannerImage', filePath);
        };

        it('should return 403 if event does not belong to user', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await request(server)
                .post(`/api/events/${eventId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(403);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('mainImage');
            expect(res.body).toHaveProperty('bannerImage');

            expect(typeof res.body.mainImage).toBe('string');
            expect(typeof res.body.bannerImage).toBe('string');

            const urlRegex = /^https?:\/\/.+|^\/.+/;
            expect(res.body.mainImage).toMatch(urlRegex);
            expect(res.body.bannerImage).toMatch(urlRegex);
        });
    });

    describe('PATCH /api/events/:id/images', () => {
        let user, token, cookie;
        let event, eventId;
        let filePath;
        let restaurant;

        beforeEach(async () => {
            await Event.deleteMany({});
            await User.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            // create event
            event = createTestEvent({ restaurant: restaurant._id });
            await event.save();
            eventId = event._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .patch(`/api/events/${eventId}/images`)
            .set('Cookie', [cookie])
            .attach('mainImage', filePath)
        };

        it('should return 400 if no images attached', async () => {
            const res = await request(server)
                .patch(`/api/events/${eventId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(400);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('mainImage');

            expect(typeof res.body.mainImage).toBe('string');

            const urlRegex = /^https?:\/\/.+|^\/.+/;
            expect(res.body.mainImage).toMatch(urlRegex);
        });
    });

    describe('PATCH /api/events/:id', () => {
        let event, eventId;
        let restaurant;
        let user, token, cookie;
        let newStartDate, newPaxLimit;

        beforeEach(async () => {
            await Event.deleteMany({});
            await Restaurant.deleteMany({});
            await Reservation.deleteMany({});

            user = await createTestUser('owner');
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            event = createTestEvent({ restaurant: restaurant._id, startDate: DateTime.now().plus({ days: 1 }).toJSDate() });
            await event.save();
            eventId = event._id;
            newStartDate = DateTime.now().plus({ days: 1, minutes: 20 }).setZone('Asia/Singapore').toISO();
            newPaxLimit = 10;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/events/${eventId}`)
                .set('Cookie', [cookie])
                .send({
                    startDate: newStartDate, paxLimit: newPaxLimit
                });
        };

        it('should return 400 if trying to change startDate when event has started', async () => {
            event.startDate = DateTime.now().minus({ days: 1 }).toJSDate();
            await event.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if paxLimit is reduced below existing reservations', async () => {
            newPaxLimit = 1;
            let reservation = createTestReservation({ event: eventId });
            await reservation.save();
            reservation = createTestReservation({ event: eventId });
            await reservation.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        
        it('should return 200 and event', async () => {
            const res = await exec();
            expect(res.status).toBe(200);  
            const requiredKeys = [
                'restaurant',
                'title',
                'description',
                'startDate',
                'endDate',
                'paxLimit',
                'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('DELETE /api/events/:id', () => {
        let event, eventId;
        let restaurant;
        let user, token, cookie;

        beforeEach(async () => {
            await Event.deleteMany({});
            await Restaurant.deleteMany({});
            await Reservation.deleteMany({});

            user = await createTestUser('owner');
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            event = createTestEvent({ restaurant: restaurant._id, startDate: DateTime.now().plus({ days: 1 }).toJSDate() });
            event.startDate = DateTime.now().plus({ hours: 1 }).toJSDate();
            await event.save();
            eventId = event._id;
        });

        const exec = () => {
            return request(server)
                .delete(`/api/events/${eventId}`)
                .set('Cookie', [cookie])
        };

        it('should return 400 if event has started', async () => {
            event.startDate = DateTime.now().minus({ days: 1 }).toJSDate();
            await event.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if event has ended', async () => {
            event.endDate = DateTime.now().minus({ days: 1 }).toJSDate();
            await event.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        
        it('should return 200 and event', async () => {
            const res = await exec();
            expect(res.status).toBe(200);  
            const requiredKeys = [
                'restaurant',
                'title',
                'description',
                'startDate',
                'endDate',
                'paxLimit',
                'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });
});