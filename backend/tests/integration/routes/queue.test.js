import request from 'supertest';
import mongoose from 'mongoose';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import QueueEntry from '../../../models/queueEntry.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import QueueCounter from '../../../models/queueCounter.model.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { serverPromise } from '../../../index.js';
import User from '../../../models/user.model.js';

describe('queue test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/queue/:id', () => {
        let user;
        let cookie;
        let token;
        let queueEntry;
        let queueEntryId;
    
        const exec = () => {
            return request(server)
            .get(`/api/queue/${queueEntryId}`)
            .set('Cookie', [cookie]);
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create queue entry
            queueEntry = new QueueEntry({
                restaurant: new mongoose.Types.ObjectId(),
                customer: user.profile,
                pax: 2,
                queueGroup: 'small',
                queueNumber: 0
            });
            await queueEntry.save();
            queueEntryId = queueEntry._id;
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'restaurant', 'customer', 'pax', 'queueGroup', 'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/queue', () => {
        let user;
        let cookie;
        let token;
        let restaurant;
        let restaurantId;
        let pax;
    
        const exec = () => {
            return request(server)
            .post('/api/queue')
            .set('Cookie', [cookie])
            .send({
                restaurant: restaurantId, pax
            });
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create queue entry
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;
            pax = 2;
        });

        it('should return 400 if invalid request', async () => {
            restaurantId = '1';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if queue closed', async () => {
            await Restaurant.findByIdAndUpdate(restaurantId, { queueEnabled: false });
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'restaurant', 'customer', 'pax', 'queueGroup', 'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('DELETE /api/queue/:id', () => {
        let user;
        let cookie;
        let token;
        let queueEntry;
        let queueEntryId;
    
        const exec = () => {
            return request(server)
            .delete(`/api/queue/${queueEntryId}`)
            .set('Cookie', [cookie]);
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            await User.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create queue entry
            queueEntry = new QueueEntry({
                restaurant: new mongoose.Types.ObjectId(),
                customer: user.profile,
                pax: 2,
                queueGroup: 'small',
                queueNumber: 0
            });
            await queueEntry.save();
            queueEntryId = queueEntry._id;
        });

        it('should return 200 if valid and delete it from the database', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'restaurant', 'customer', 'pax', 'queueGroup', 'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));

            const queueEntryInDb = await QueueEntry.findById(res.body._id);
            expect(queueEntryInDb).toBeNull();
        });
    });

    describe('GET /api/queue/restaurant/:id', () => {
        let user;
        let cookie;
        let token;
        let queueEntry;
        let queueCounter;
        let restaurant;
        let restaurantId;
        let staff;
    
        const exec = () => {
            return request(server)
            .get(`/api/queue/restaurant/${restaurantId}`)
            .set('Cookie', [cookie]);
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            await Restaurant.deleteMany({});
            await QueueCounter.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            staff = await createTestStaff(restaurant._id);
            restaurantId = restaurant._id;
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();
            
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            // create queue entry
            queueEntry = new QueueEntry({
                restaurant: restaurantId,
                customer: user.profile,
                pax: 2,
                queueGroup: 'small',
                queueNumber: 1
            });
            await queueEntry.save();

            // create queue counter
            queueCounter = new QueueCounter({
                restaurant: restaurantId,
                queueGroup: 'small',
                lastNumber: 1,
                calledNumber: 0,
            });
            await queueCounter.save();
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'small', 'medium', 'large'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('GET /api/queue/restaurant/:id/overview', () => {
        let user;
        let cookie;
        let token;
        let queueEntry;
        let queueCounter;
        let restaurant;
        let restaurantId;
        let staff;
    
        const exec = () => {
            return request(server)
            .get(`/api/queue/restaurant/${restaurantId}/overview`)
            .set('Cookie', [cookie]);
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            await Restaurant.deleteMany({});
            await QueueCounter.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            staff = await createTestStaff(restaurant._id);
            restaurantId = restaurant._id;
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();
            
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            // create 2 queue entries
            queueEntry = new QueueEntry({
                restaurant: restaurantId,
                customer: user.profile,
                pax: 2,
                queueGroup: 'small',
                queueNumber: 1
            });
            await queueEntry.save();

            queueEntry = new QueueEntry({
                restaurant: restaurantId,
                customer: new mongoose.Types.ObjectId(),
                pax: 5,
                queueGroup: 'large',
                queueNumber: 1
            });
            await queueEntry.save();

            // create 2 queue counters
            queueCounter = new QueueCounter({
                restaurant: restaurantId,
                queueGroup: 'small',
                lastNumber: 1, 
                calledNumber: 0,
            });
            await queueCounter.save();

            queueCounter = new QueueCounter({
                restaurant: restaurantId,
                queueGroup: 'large',
                lastNumber: 1, 
                calledNumber: 0,
            });
            await queueCounter.save();
        });

        it('should return 403 if restaurant does not belong to staff', async () => {
            const otherStaff = await createTestStaff(new mongoose.Types.ObjectId());
            await otherStaff.save();
            token = staffGenerateAuthToken(otherStaff);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            const requiredKeys = [
                'small', 'medium', 'large'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));

            // checking waiting array lengths
            expect(Array.isArray(res.body.small.waiting)).toBe(true);
            expect(res.body.small.waiting).toHaveLength(1);

            expect(Array.isArray(res.body.medium.waiting)).toBe(true);
            expect(res.body.medium.waiting).toHaveLength(0);

            expect(Array.isArray(res.body.large.waiting)).toBe(true);
            expect(res.body.large.waiting).toHaveLength(1);
        });
    });

    describe('PATCH /api/queue/:id/status', () => {
        let user;
        let cookie;
        let token;
        let queueEntry;
        let queueEntryId;
        let restaurant;
        let staff;
        let newStatus;
    
        const exec = () => {
            return request(server)
            .patch(`/api/queue/${queueEntryId}/status`)
            .set('Cookie', [cookie])
            .send({
                status: newStatus
            });
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            await Restaurant.deleteMany({});
            await QueueCounter.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();
            
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            // create queue entry
            queueEntry = new QueueEntry({
                restaurant: restaurant._id,
                customer: user.profile,
                pax: 2,
                queueGroup: 'small',
                queueNumber: 1
            });
            await queueEntry.save();
            queueEntryId = queueEntry._id;
            newStatus = 'seated';
        });

        it('should return 400 if bad request', async () => {
            newStatus = 'waiting';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            const requiredKeys = [
                'restaurant', 'customer', 'pax', 'queueGroup', 'status'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.status).toEqual(newStatus);
            expect(res.body.statusTimestamps[newStatus]).toBeDefined();
        });
    });

    describe('PATCH /api/queue/restaurant/:id/next', () => {
        let user;
        let cookie;
        let token;
        let queueEntry;
        let restaurant;
        let restaurantId;
        let staff;
        let queueGroup;
        let queueCounter;
    
        const exec = () => {
            return request(server)
            .patch(`/api/queue/restaurant/${restaurantId}/next?queueGroup=${queueGroup}`)
            .set('Cookie', [cookie]);
        };
    
        beforeEach(async () => {
            await QueueEntry.deleteMany({});
            await Restaurant.deleteMany({});
            await QueueCounter.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            staff = await createTestStaff(restaurant._id);
            restaurantId = restaurant._id;
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();
            
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            // create 2 queue entries
            queueEntry = new QueueEntry({
                restaurant: restaurantId,
                customer: user.profile,
                pax: 2,
                queueGroup: 'small',
                queueNumber: 1
            });
            await queueEntry.save();

            queueEntry = new QueueEntry({
                restaurant: restaurantId,
                customer: new mongoose.Types.ObjectId(),
                pax: 5,
                queueGroup: 'large',
                queueNumber: 1
            });
            await queueEntry.save();

            // create 2 queueCounters
            queueCounter = new QueueCounter({
                restaurant: restaurantId,
                queueGroup: 'small',
                calledNumber: 0,
                lastNumber: 1
            });
            await queueCounter.save();

            queueCounter = new QueueCounter({
                restaurant: restaurantId,
                queueGroup: 'large',
                calledNumber: 0,
                lastNumber: 0
            });
            await queueCounter.save();
            queueGroup = 'small';
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            // it should update the queueCounter
            const counter = await QueueCounter.findOne({ restaurant: restaurantId, queueGroup });
            expect(counter.calledNumber).toBe(1);

            // it should update the status
            expect(res.body.status).toBe('called');
        });

        it('should return the right queueEntry', async () => {
            queueGroup = 'large';
            const res = await exec();
            expect(res.body.queueGroup).toBe('large');
            expect(res.body.queueNumber).toBe(1);
        });
    });

    describe('PATCH /api/restaurant/:id/toggle', () => {
        let user;
        let cookie;
        let token;
        let restaurant;
        let restaurantId;
        let staff;
        let toggle;
    
        const exec = () => {
            return request(server)
            .patch(`/api/queue/restaurant/${restaurantId}/queue`)
            .set('Cookie', [cookie])
            .send({
                enabled: toggle
            });
        };
    
        beforeEach(async () => {
            await Restaurant.deleteMany({});
            
            // create customer
            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            restaurantId = restaurant._id;
            await restaurant.save();
            await staff.save();
            
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);
            toggle = false;
        });

        it('should return 400 if bad request', async () => {
            toggle = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 if valid', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('queueEnabled');
            expect(res.body.queueEnabled).toEqual(toggle);
        });
    });
});
