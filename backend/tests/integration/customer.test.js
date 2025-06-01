const User = require('../../models/user.model');
const CustomerProfile = require('../../models/customerProfile.model');
const { createTestUser } = require('../factories/user.factory');
const { createTestCustomerProfile } = require('../factories/customerProfile.factory');
const { generateAuthToken } = require('../../services/user.service');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { profile } = require('winston');

describe('customer test', () => {
    let server;
    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/customers/me', () => {
        let email;
        let username;
        let password;
        let role;
        let roleProfile;
        let token;
        let user;

        const exec = () => {
            return request(server)
                .get('/api/customers/me')
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            email = "myEmail@gmail.com";
            username = "username";
            password = "myPassword@123";
            role = "customer";
            roleProfile = "CustomerProfile";

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                email,
                username,
                password: hashedPassword,
                role,
                roleProfile,
                profile: new mongoose.Types.ObjectId(),
            });

            await user.save();
            token = generateAuthToken(user);
        });

        it('should return 401 if no token', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            token = "invalid-token";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 if valid token', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return user details', async () => {
            const res = await exec();
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'email', 'username', 'role', 'profile'
            ]));
        });
    });

    describe('GET /api/customers/:id', () => {
        let email;
        let username;
        let password;
        let role;
        let roleProfile;
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

            email = "myEmail@gmail.com";
            username = "username";
            password = "myPassword@123";
            role = "customer";
            roleProfile = "CustomerProfile";

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // create user
            user = new User({
                email,
                username,
                password: hashedPassword,
                role,
                roleProfile,
                profile: new mongoose.Types.ObjectId(),
            });

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
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'dateJoined', 'totalBadges'
            ]));
        });
    });

    describe('PUT /api/customers/me', () => {
        let token;
        let email;
        let username;
        let password = 'myPassword@123';
        let name;
        let contactNumber;
        let favCuisines;
        let user;
        let profile;
        let newContactNumber;

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            // creates user with password: myPassword@123
            user = await createTestUser('customer');
            email = user.email;
            username = user.username;

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

            // update the customer
            newContactNumber = "12345678";
        });

        const exec = () => {
            return request(server)
                .put('/api/customers/me')
                .set('x-auth-token', token)
                .send({
                    email, username, password, name, 
                    contactNumber: newContactNumber, favCuisines
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

        it('should return 400 if invalid request', async () => {
            token = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

         it('should return 404 if user not found', async () => {
            let otherUser = await createTestUser('customer');
            token = generateAuthToken(otherUser);
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
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('role');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('name');
            expect(res.body.profile).toHaveProperty('contactNumber');
        });
    });
});