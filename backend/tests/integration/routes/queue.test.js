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

describe('queue test', () => {
    let server;
    beforeAll(async () => {
        const mod = await import('../../../index.js');
        server = mod.default;
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
        let queueNumber;
    
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
            queueEntry.save();
            queueEntryId = queueEntry._id;
        });

        it('should return 400 if invalid id', async () => {
            queueEntryId = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 401 if no token', async () => {
            cookie = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            token = 'invalid-token';
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if owner', async () => {
            const owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if invalid ID', async () => {
            queueEntryId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if customer does not own queue entry', async () => {
            const otherQueueEntry = new QueueEntry({
                restaurant: new mongoose.Types.ObjectId(),
                customer: new mongoose.Types.ObjectId(),
                pax: 2,
                queueGroup: 'small',
                queueNumber: 0
            });
            otherQueueEntry.save();
            queueEntryId = otherQueueEntry._id;
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

    describe('POST /api/queue', () => {
        let user;
        let cookie;
        let token;
        let restaurant;
        let pax;
        let customer;
        let queueGroup;
    
        const exec = () => {
            return request(server)
            .post('/api/queue')
            .set('Cookie', [cookie])
            .send({
                restaurant, pax
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
            restaurant = new mongoose.Types.ObjectId();
            customer = user.profile;
            pax = 2;
            queueGroup = 'small';
        });

        it('should return 401 if no token', async () => {
            cookie = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            token = 'invalid-token';
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if owner', async () => {
            const owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid request', async () => {
            restaurant = '1';
            const res = await exec();
            expect(res.status).toBe(400);
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
            queueEntry.save();
            queueEntryId = queueEntry._id;
            
        });

        it('should return 400 if invalid id', async () => {
            queueEntryId = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 401 if no token', async () => {
            cookie = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            token = 'invalid-token';
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if owner', async () => {
            const owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if invalid ID', async () => {
            queueEntryId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if customer does not own queue entry', async () => {
            const otherQueueEntry = new QueueEntry({
                restaurant: new mongoose.Types.ObjectId(),
                customer: new mongoose.Types.ObjectId(),
                pax: 2,
                queueGroup: 'small',
                queueNumber: 0
            });
            otherQueueEntry.save();
            queueEntryId = otherQueueEntry._id;
            const res = await exec();
            expect(res.status).toBe(403);
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
                queueNumber: 0
            });
            await queueEntry.save();
        });

        it('should return 400 if invalid id', async () => {
            restaurantId = "1";
            const res = await exec();
            expect(res.status).toBe(400);
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
        });

        it('should return 400 if invalid id', async () => {
            restaurantId = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 401 if no token', async () => {
            cookie = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            token = 'invalid-token';
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if not staff', async () => {
            const customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if invalid ID', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
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
});
