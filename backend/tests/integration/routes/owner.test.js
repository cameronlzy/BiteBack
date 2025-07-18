import OwnerProfile from '../../../models/ownerProfile.model.js';
import User from '../../../models/user.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import Staff from '../../../models/staff.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestOwnerProfile } from '../../factories/ownerProfile.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import mongoose from 'mongoose';

describe('owner test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/owners/me', () => {
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

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
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

    describe('POST /api/owners', () => {
        let token;
        let user;
        let cookie;
        let username, companyName;

        const exec = () => {
            return request(server)
                .post('/api/owners')
                .set('Cookie', [cookie])
                .send({
                    username, companyName
                })
        };

        beforeEach(async () => {
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            username = 'username';
            companyName = 'name';
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
                'username', 'companyName'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/owners/staff/access', () => {
        let email;
        let username;
        let password;
        let role;
        let roleProfile;
        let token;
        let user;
        let cookie;
        let profile;
        let restaurant;
        let staff;

        const exec = () => {
            return request(server)
                .post('/api/owners/staff/access')
                .set('Cookie', [cookie])
                .send({
                    password
                });
        };

        beforeEach(async () => {
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            await Staff.deleteMany({});

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

            // create restaurant
            restaurant = createTestRestaurant(user.profile);
            staff = await createTestStaff(restaurant._id);

            // create owner profile
            profile = createTestOwnerProfile(user);
            user.profile = profile._id;
            profile.restaurants = [restaurant._id];

            await user.save();
            await profile.save();
            await staff.save();
            await restaurant.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 + staff credentials', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'restaurant', 'staff'
            ];
            expect(Object.keys(res.body[0])).toEqual(expect.arrayContaining(requiredKeys));
            expect(Object.keys(res.body[0].staff)).toEqual(expect.arrayContaining(['_id', 'username', 'password']));
        });
    });

    describe('PATCH /api/owners/me', () => {
        let token;
        let email;
        let username;
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
            restaurant = createTestRestaurant(user.profile);
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

        it('should return 200 if valid request and updated user + profile', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
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