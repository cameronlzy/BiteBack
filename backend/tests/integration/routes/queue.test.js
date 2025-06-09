const request = require('supertest');
const mongoose = require('mongoose');
const setTokenCookie = require('../../../helpers/setTokenCookie');
const QueueEntry = require('../../../models/queueEntry.model');
const { generateAuthToken } = require('../../../services/user.service');
const { createTestUser } = require('../../factories/user.factory');

describe('queue test', () => {
    let server;
    beforeAll(() => {
        server = require('../../../index');
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

        it('should return 404 if invalid ID', async () => {
            const otherQueueEntry = new QueueEntry({
                restaurant: new mongoose.Types.ObjectId(),
                customer: new mongoose.Types.ObjectId(),
                pax: 2,
                queueGroup: 'small',
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

        it('should return 404 if invalid ID', async () => {
            const otherQueueEntry = new QueueEntry({
                restaurant: new mongoose.Types.ObjectId(),
                customer: new mongoose.Types.ObjectId(),
                pax: 2,
                queueGroup: 'small',
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
});
