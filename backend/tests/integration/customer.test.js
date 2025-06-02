const User = require('../../models/user.model');
const CustomerProfile = require('../../models/customerProfile.model');
const { createTestUser } = require('../factories/user.factory');
const { createTestCustomerProfile } = require('../factories/customerProfile.factory');
const { generateAuthToken } = require('../../services/user.service');
const setTokenCookie = require('../../helpers/setTokenCookie');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        let cookie;

        const exec = () => {
            return request(server)
                .get('/api/customers/me')
                .set('Cookie', [cookie]);
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
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('role');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('name');
            expect(res.body.profile).toHaveProperty('contactNumber');
        });
    });
});