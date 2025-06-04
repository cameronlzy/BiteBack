const Reservation = require('../../models/reservation.model');
const User = require('../../models/user.model');
const Restaurant = require('../../models/restaurant.model');
const OwnerProfile = require('../../models/ownerProfile.model');
const { createTestUser } = require('../factories/user.factory');
const { createTestRestaurant } = require('../factories/restaurant.factory');
const { createTestOwnerProfile } = require('../factories/ownerProfile.factory');
const { generateAuthToken } = require('../../services/user.service');
const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const { DateTime } = require('luxon');
const setTokenCookie = require('../../helpers/setTokenCookie');

describe('restaurant test', () => {
    let server;

    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/restaurants', () => {
        let restaurant;

        beforeEach(async () => {
            await Restaurant.deleteMany({});

            // create 3 restaurants
            for (let step = 0; step < 3; step++) {
                restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
                await restaurant.save();
            }
        });

        const exec = () => {
            return request(server)
            .get('/api/restaurants');
        };

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return an array of restaurants', async () => {
            const res = await exec();
            expect(res.body.length).toBe(3);
            res.body.forEach(restaurant => {
                expect(restaurant).toHaveProperty('name');
                expect(restaurant).toHaveProperty('address');
                expect(restaurant).toHaveProperty('contactNumber');
                expect(restaurant).toHaveProperty('cuisines');
                expect(restaurant).toHaveProperty('openingHours');
                expect(restaurant).toHaveProperty('maxCapacity');
            });
        });
    });

    describe('GET /api/restaurants/:id', () => {
        let restaurant;
        let restaurantId;

        beforeEach(async () => {
            await Restaurant.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;
        });

        const exec = () => {
            return request(server)
            .get(`/api/restaurants/${restaurantId}`);
        };

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return a restaurant object', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('contactNumber');
            expect(res.body).toHaveProperty('cuisines');
            expect(res.body).toHaveProperty('openingHours');
            expect(res.body).toHaveProperty('maxCapacity');
        });
    });

    describe('GET /api/restaurants/:id/availability', () => {
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let queryDateSG;
        let pax;
        let url;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservationDate = new Date('2025-05-17T11:00'); // UTC date
            queryDateSG = DateTime.fromJSDate(reservationDate, { zone: 'utc' }).setZone('Asia/Singapore').toISODate(); // SG date
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, pax
            });
            await reservation.save();

            // create url
            url = `/api/restaurants/${restaurantId}/availability?date=${queryDateSG}`;
        });

        const exec = () => {
            return request(server)
            .get(url);
        };

        it('should return 400 if invalid id', async () => {
            url = `/api/restaurants/1/availability?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if no date query', async () => {
            url = `/api/restaurants/${restaurantId}/availability`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid date', async () => {
            url = `/api/restaurants/${restaurantId}/availability?date=1`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if no restaurant found', async () => {
            url = `/api/restaurants/${user._id}/availability?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token, restaurant closed', async () => {
            const sunday = DateTime.fromISO('2025-05-18').setZone('Asia/Singapore').toISODate();
            url = `/api/restaurants/${restaurantId}/availability?date=${sunday}`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toBe(-1);
        });

        it('should return 200 if valid token, restaurant not closed', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return an array of availability', async () => {
            const res = await exec();
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(slot => {
                expect(slot).toHaveProperty('time');
                expect(typeof slot.time).toBe('string');
                expect(slot.time).toMatch(/^\d{2}:\d{2}$/);

                expect(slot).toHaveProperty('available');
                expect(typeof slot.available).toBe('number');
                expect(slot.available).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('POST /api/restaurants', () => {
        let name;
        let address;
        let contactNumber;
        let cuisines;
        let openingHours;
        let maxCapacity;

        let owner;
        let ownerProfile;

        let email;
        let username;
        let password;
        let role;
        let token;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create an owner
            email = "myOwner@gmail.com";
            username = "myOwner";
            password = "myPassword@123";
            role = "owner";
            owner = await User({
                email, username, password, role, profile: new mongoose.Types.ObjectId(), roleProfile: "OwnerProfile"
            });
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // creating an ownerProfile
            ownerProfile = createTestOwnerProfile(owner);
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();

            // creating a restaurant
            name = "restaurant";
            address = "new york";
            contactNumber = "87654321";
            cuisines = ["Chinese"];
            openingHours = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
            maxCapacity = 50;
        });

        const exec = () => {
            return request(server)
            .post('/api/restaurants')
            .set('Cookie', [cookie])
            .send({
                name, address, contactNumber, cuisines,
                openingHours, maxCapacity
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
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if user does not exist', async () => {
            await User.deleteMany({});
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return a restaurant object', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('contactNumber');
            expect(res.body).toHaveProperty('cuisines');
            expect(res.body).toHaveProperty('openingHours');
            expect(res.body).toHaveProperty('maxCapacity');
        });
    });

    // skip to avoid sending test images to cloudinary
    describe.skip('POST /api/restaurants/:id/images', () => {
        let owner;
        let ownerProfile;
        let restaurant;
        let restaurantId;
        let token;
        let cookie;
        let filePath;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create an owner
            owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // creating an ownerProfile
            ownerProfile = createTestOwnerProfile(owner);
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();

            // creating a restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            // image file path
            filePath = path.join(__dirname, '../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .post(`/api/restaurants/${restaurantId}/images`)
            .set('Cookie', [cookie])
            .attach('images', filePath);
        };

        it.skip('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('images');
            expect(Array.isArray(res.body.images)).toBe(true);

            const allStrings = res.body.images.every(url => typeof url === 'string');
            expect(allStrings).toBe(true);
        });
    });

    describe('PATCH /api/restaurants/:id', () => {
        let restaurant;
        let restaurantId;
        let token;
        let name;
        let address;
        let contactNumber;
        let cuisines;
        let openingHours;
        let maxCapacity;
        let owner;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            
            // create an owner
            owner = await createTestUser('owner');
            await owner.save();
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            // updated details
            name = "restaurant";
            address = "new york";
            contactNumber = "87654321";
            cuisines = ["Chinese"];
            openingHours = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
            maxCapacity = 50;
        });

        const exec = () => {
            return request(server)
            .patch(`/api/restaurants/${restaurantId}`)
            .set('Cookie', [cookie])
            .send({
                name, address, contactNumber, cuisines,
                openingHours, maxCapacity
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

        it('should return 400 if invalid id', async () => {
            restaurantId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid request', async () => {
            cuisines = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if restaurant does not belong to user', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated restaurant', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('contactNumber');
            expect(res.body).toHaveProperty('cuisines');
            expect(res.body).toHaveProperty('openingHours');
            expect(res.body).toHaveProperty('maxCapacity');
        });
    });

    describe('DELETE /api/restaurants/:id', () => {
        let restaurant;
        let restaurantId;
        let token;
        let owner;
        let email;
        let username;
        let password;
        let role;
        let ownerProfile;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create an owner
            email = "myOwner@gmail.com";
            username = "myOwner";
            password = "myPassword@123";
            role = "owner";
            owner = await User({
                email, username, password, role, profile: new mongoose.Types.ObjectId(), roleProfile: "OwnerProfile"
            });
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // creating a restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();

            // creating an ownerProfile
            ownerProfile = createTestOwnerProfile(owner);
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;
        });

        const exec = () => {
            return request(server)
            .delete(`/api/restaurants/${restaurantId}`)
            .set('Cookie', [cookie]);
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

        it('should return 400 if invalid id', async () => {
            restaurantId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if user does not exist', async () => {
            await User.deleteMany({});
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if restaurant does not belong to user', async () => {
            let otherOwner = await createTestUser('owner');

            let otherOwnerProfile = createTestOwnerProfile(otherOwner);
            await otherOwnerProfile.save();
            otherOwner.profile = otherOwnerProfile._id;
            await otherOwner.save();

            token = generateAuthToken(otherOwner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated restaurant', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('contactNumber');
            expect(res.body).toHaveProperty('cuisines');
            expect(res.body).toHaveProperty('openingHours');
            expect(res.body).toHaveProperty('maxCapacity');
        });
    });
});