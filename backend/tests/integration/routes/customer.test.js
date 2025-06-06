const User = require('../../../models/user.model');
const CustomerProfile = require('../../../models/customerProfile.model');
const { createTestUser } = require('../../factories/user.factory');
const { createTestCustomerProfile } = require('../../factories/customerProfile.factory');
const { generateAuthToken } = require('../../../services/user.service');
const setTokenCookie = require('../../../helpers/setTokenCookie');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

describe('customer test', () => {
    let server;
    beforeAll(() => {
        server = require('../../../index');
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

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie("invalid-token");
            const res = await exec();
            expect(res.status).toBe(401);
        });
        
        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return user details', async () => {
            const res = await exec();
            const requiredKeys = [
                'email', 'username', 'role', 'profile'
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
            profile = createTestCustomerProfile(user);
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

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return user details', async () => {
            const res = await exec();
            const requiredKeys = [
                'dateJoined', 'totalBadges'
            ]
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('PATCH /api/customers/me', () => {
        let token;
        let email;
        let username;
        let password;
        let name;
        let contactNumber;
        let favCuisines;
        let user;
        let profile;
        let newContactNumber;
        let cookie;

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            // creates user with password: Password@123
            user = await createTestUser('customer');
            email = user.email;
            username = user.username;
            password = "Password@123";

            // create customer profile
            name = "test";
            contactNumber = "87654321";
            favCuisines = ['Chinese'];
            profile = new CustomerProfile({
                user: user._id,
                name, contactNumber, username, favCuisines
            });
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
                    email, username, password, name, 
                    contactNumber: newContactNumber, favCuisines
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

        it('should return 403 if owner', async () => {
            let owner = createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid request', async () => {
            password = 'weak';
            const res = await exec();
            expect(res.status).toBe(400);
        });

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
            username = otherUser.username;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if profile not found', async () => {
            user.profile = new mongoose.Types.ObjectId();
            await user.save();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated user + profile', async () => {
            const res = await exec();
            const requiredKeys = [
                'email', 'username', 'role'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('name');
            expect(res.body.profile).toHaveProperty('contactNumber');
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

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie("invalid-token");
            const res = await exec();
            expect(res.status).toBe(401);
        });
        
        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if incorrect password', async () => {
            password = 'wrongPassword';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 if valid token and delete user', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            let dbUser = await User.findById(userId).lean();
            expect(dbUser).toBeNull();
        });

        it('should return user details', async () => {
            const res = await exec();
            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });
});