import User from '../../../models/user.model.js';
import CustomerProfile from '../../../models/customerProfile.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { generateAuthToken, generateTempToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import request from 'supertest';
import mongoose from 'mongoose';
import config from 'config';
import cookieParser from 'cookie';
import jwt from 'jsonwebtoken';

describe('customer test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/customers/me', () => {
        let token;
        let user;
        let cookie;

        const exec = () => {
            return request(server)
                .get('/api/customers/me')
                .set('Cookie', [cookie]);
        };

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            user = await createTestUser('customer');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
        });

        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid token and full user object', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'email', 'role', 'profile'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('GET /api/customers/:id', () => {
        let user;
        let customerId;
        let profile;

        const exec = () => {
            return request(server)
                .get(`/api/customers/${customerId}`);
        };

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            // create user
            user = await createTestUser('customer');

            // create customer profile
            profile = createTestCustomerProfile(user._id);
            await profile.save();
            customerId = profile._id;

            user.profile = profile._id;
            await user.save();
        });

        it('should return 404 if customer not found', async () => {
            let otherCustomer = await createTestUser('customer');
            customerId = otherCustomer._id;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token and user object', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'dateJoined'
            ]
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/customers', () => {
        let token;
        let user;
        let cookie;
        let name, contactNumber;

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            user = await createTestUser('customer');
            user.profile = undefined;
            user.username = undefined;
            await user.save();
            token = generateTempToken(user);
            cookie = setTokenCookie(token);

            name = 'name';
            contactNumber = '87654321';
        });

        const exec = () => {
            return request(server)
                .post('/api/customers')
                .set('Cookie', [cookie])
                .send({
                    name, contactNumber
                });
        };

        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateTempToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 and profile', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'name', 'contactNumber'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('PATCH /api/customers/me', () => {
        let token;
        let user;
        let profile;
        let newContactNumber;
        let cookie;

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            // creates user with password: Password@123
            user = await createTestUser('customer');

            // create customer profile
            profile = createTestCustomerProfile(user._id);
            await profile.save();

            user.profile = profile._id;
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // update the customer
            newContactNumber = "12345678";
        });

        const exec = () => {
            return request(server)
                .patch('/api/customers/me')
                .set('Cookie', [cookie])
                .send({
                    contactNumber: newContactNumber
                });
        };

         it('should return 404 if user not found', async () => {
            let otherUser = await createTestUser('customer');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if username already taken', async () => {
            let otherUser = await createTestUser('customer');
            await otherUser.save();
            const res = await request(server)
            .patch('/api/customers/me')
            .set('Cookie', [cookie])
            .send({
                username: otherUser.username
            });
            expect(res.status).toBe(400);
        });

        it('should return 404 if profile not found', async () => {
            user.profile = new mongoose.Types.ObjectId();
            await user.save();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid request and return updated user + profile', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'email', 'username', 'role'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('name');
            expect(res.body.profile).toHaveProperty('contactNumber');
        });

        it('should return valid jwtToken', async () => {
            const res = await exec();
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();

            const parsed = cookieParser.parse(cookies[0]);
            const token = parsed.token;
            expect(token).toBeDefined();
    
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(decoded)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('DELETE /api/customers/me', () => {
        let token;
        let user;
        let userId;
        let password;
        let cookie;

        const exec = () => {
            return request(server)
                .delete('/api/customers/me')
                .set('Cookie', [cookie])
                .send({
                    password
                });
        };

        beforeEach(async () => {
            await User.deleteMany({});

            // creates a test user with password: Password@123
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;

            password = "Password@123";
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
        });

        it('should return 400 if incorrect password', async () => {
            password = 'wrongPassword';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and delete user', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            let dbUser = await User.exists({ _id: userId });
            expect(dbUser).toBeNull();
        });
    });
});