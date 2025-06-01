const request = require('supertest');
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Review = require('../../models/review.model');
const { createTestUser } = require('../factories/user.factory');
const { createTestRestaurant } = require('../factories/restaurant.factory');
const { createTestCustomerProfile } = require('../factories/customerProfile.factory');
const { generateAuthToken } = require('../../services/user.service');
const User = require('../../models/user.model');
const Restaurant = require('../../models/restaurant.model');
const CustomerProfile = require('../../models/customerProfile.model');

describe('review test', () => {
	let server;
	beforeAll(() => {
		server = require('../../index');
	});
	afterAll(async () => {
		await mongoose.connection.close();
		await server.close();
	});

	describe('GET /api/reviews/:id', () => {
        let review;
        let reviewId;
        let user;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            
            // create customer 
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            dateVisited = Date.now();
            review = new Review({
                customer: profile._id,
                username: user.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited
            });
            await review.save();
            reviewId = review._id;
		});

        const exec = () => {
            return request(server)
            .get(`/api/reviews/${reviewId}`);
        };

        it('should return 400 if invalid ID', async () => {
            reviewId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('rating');
            expect(res.body).toHaveProperty('reviewText');
            expect(res.body).toHaveProperty('dateVisited');
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('badgesCount');
            expect(res.body).toHaveProperty('isVisible');
        });
	});

    describe('POST /api/reviews/:id', () => {
        let user;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            
            // create customer 
            user = await createTestUser('customer');
            token = generateAuthToken(user);
            profile = createTestCustomerProfile(user);
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            dateVisited = DateTime.now().toISODate();
		});

        const exec = () => {
            return request(server)
            .post(`/api/reviews`)
            .set('x-auth-token', token)
            .send({
                restaurant: restaurant._id,
                rating, reviewText, dateVisited
            });
        };

        it('should return 401 if no token', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            token = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid request', async () => {
            rating = 6;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('rating');
            expect(res.body).toHaveProperty('reviewText');
            expect(res.body).toHaveProperty('dateVisited');
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('badgesCount');
            expect(res.body).toHaveProperty('isVisible');
        });
	});

    describe('DELETE /api/reviews/:id', () => {
        let review;
        let reviewId;
        let user;
        let restaurant;
        let profile;
        let name;
        let contactNumber;
        let favCuisines;
        let rating;
        let reviewText;
        let dateVisited;
        let token;

		beforeEach(async () => {
			// clear all
            await User.deleteMany({});
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            
            // create customer 
            name = "name";
            contactNumber = "87654321";
            favCuisines = ['Chinese'];
            user = await createTestUser('customer');
            token = generateAuthToken(user);

            profile = createTestCustomerProfile(user);
            await profile.save();
            user.profile = profile._id;
            await user.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            dateVisited = Date.now();
            review = new Review({
                customer: profile._id,
                username: user.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited
            });
            await review.save();
            reviewId = review._id;
		});

        const exec = () => {
            return request(server)
            .delete(`/api/reviews/${reviewId}`)
            .set('x-auth-token', token);
        };

        it('should return 401 if no token', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            token = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if user does not exist', async () => {
            let otherCustomer = await createTestUser('customer');
            token = generateAuthToken(otherCustomer);
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if review does not belong to user', async () => {
            let otherCustomer = await createTestUser('customer');
            await otherCustomer.save();
            token = generateAuthToken(otherCustomer);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('rating');
            expect(res.body).toHaveProperty('reviewText');
            expect(res.body).toHaveProperty('dateVisited');
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('badgesCount');
            expect(res.body).toHaveProperty('isVisible');
        });
	});
});