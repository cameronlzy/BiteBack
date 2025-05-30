const OwnerProfile = require('../../models/ownerProfile.model');
const User = require('../../models/user.model');
const Restaurant = require('../../models/reservation.model');
const { createTestUser } = require('../factories/user.factory');
const { createTestRestaurant } = require('../factories/restaurant.factory');
const { generateAuthToken } = require('../../services/user.service');
const { validateNewOwner } = require('../../validators/ownerProfile.validator');
const bcrypt = require('bcrypt');
const request = require('supertest');
const mongoose = require('mongoose');

describe('owner test', () => {
    let server;
    beforeAll(() => {
        server = require('../../index');
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

        const exec = () => {
            return request(server)
                .get('/api/owners/me')
                .set('x-auth-token', token);
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

        it('should return 200 if valid token for customer', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return user details', async () => {
            const res = await exec();
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
                'email', 'username', 'role', 'profile'
            ]));
        });

        it('should return 200 if valid token for owner', async () => {
            let owner = await createTestUser('owner');

            // creating restaurant
            let restaurant = createTestRestaurant(owner._id);
            await restaurant.save();

            // creating an ownerProfile
            let companyName = "name";
            let ownerProfile = await OwnerProfile({
                user: owner._id,
                companyName, 
                restaurants: [restaurant._id]
            });
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();
            token = generateAuthToken(user);

            const res = await exec();
            expect(res.status).toBe(200);
        });
    });

    describe('PUT /api/owners/me', () => {
        let token;
        let email;
        let username;
        let password = 'myPassword@123';
        let companyName;
        let user;
        let profile;
        let newCompanyName;
        let restaurant;

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
            companyName = "company";
            profile = new OwnerProfile({
                user: user._id,
                companyName,
                restaurants: [restaurant._id]
            });
            await profile.save();

            user.profile = profile._id;
            await user.save();
            token = generateAuthToken(user);

            // update the customer
            newCompanyName = "new name";
        });

        const exec = () => {
            return request(server)
                .put('/api/owners/me')
                .set('x-auth-token', token)
                .send({
                    email, username, password, companyName: newCompanyName
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
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
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
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('role');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('companyName');
            expect(res.body.profile).toHaveProperty('restaurants');
        });
    });
});