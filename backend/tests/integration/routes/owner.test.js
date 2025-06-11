const OwnerProfile = require('../../../models/ownerProfile.model');
const User = require('../../../models/user.model');
const Restaurant = require('../../../models/reservation.model');
const { createTestUser } = require('../../factories/user.factory');
const { createTestRestaurant } = require('../../factories/restaurant.factory');
const { createTestOwnerProfile } = require('../../factories/ownerProfile.factory');
const { generateAuthToken } = require('../../../helpers/token.helper');
const { setTokenCookie } = require('../../../helpers/cookie.helper');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const mongoose = require('mongoose');

describe('owner test', () => {
    let server;
    beforeAll(() => {
        server = require('../../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/owners/me', () => {
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
                .get('/api/owners/me')
                .set('Cookie', [cookie]);
        };

        beforeEach(async () => {
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            email = "myEmail@gmail.com";
            username = "username";
            password = "myPassword@123";
            role = "owner";
            roleProfile = "OwnerProfile";

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

        it('should return 401 if no cookie', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 + user details', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('PATCH /api/owners/me', () => {
        let token;
        let email;
        let username;
        let password = 'myPassword@123';
        let user;
        let profile;
        let newCompanyName;
        let restaurant;
        let cookie;

        beforeEach(async () => {
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // creates user with password: myPassword@123
            user = await createTestUser('owner');
            email = user.email;
            username = user.username;

            // create restaurant
            restaurant = createTestRestaurant(user._id);
            await restaurant.save();

            // create owner profile
            profile = createTestOwnerProfile(user);
            await profile.save();

            user.profile = profile._id;
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // update the customer
            newCompanyName = "new name";
        });


        const exec = () => {
            return request(server)
                .patch('/api/owners/me')
                .set('Cookie', [cookie])
                .send({
                    email, username, companyName: newCompanyName
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

        it('should return 403 if customer', async () => {
            let customer = createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

         it('should return 404 if user not found', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if username already taken', async () => {
            let otherUser = await createTestUser('owner');
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
            expect(res.body.profile).toHaveProperty('companyName');
            expect(res.body.profile).toHaveProperty('restaurants');
        });
    });

    describe('DELETE /api/owners/me', () => {
        let token;
        let user;
        let userId;
        let password;
        let cookie;

        const exec = () => {
            return request(server)
                .delete('/api/owners/me')
                .set('Cookie', [cookie])
                .send({
                    password
                });
        };

        beforeEach(async () => {
            await User.deleteMany({});

            // creates a test user with password: Password@123
            user = await createTestUser('owner');
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
        
        it('should return 403 if customer', async () => {
            let owner = await createTestUser('customer');
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

            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));

            let dbUser = await User.findById(userId).lean();
            expect(dbUser).toBeNull();
        });
    });
});