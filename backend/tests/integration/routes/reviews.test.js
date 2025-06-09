const request = require('supertest');
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Review = require('../../../models/review.model');
const { createTestUser } = require('../../factories/user.factory');
const { createTestRestaurant } = require('../../factories/restaurant.factory');
const { createTestCustomerProfile } = require('../../factories/customerProfile.factory');
const { createTestReview } = require('../../factories/review.factory');
const { generateAuthToken } = require('../../../services/user.service');
const setTokenCookie = require('../../../helpers/setTokenCookie');
const User = require('../../../models/user.model');
const Restaurant = require('../../../models/restaurant.model');
const CustomerProfile = require('../../../models/customerProfile.model');
const OwnerProfile = require('../../../models/ownerProfile.model');
const ReviewBadgeVote = require('../../../models/reviewBadgeVote.model');

describe('review test', () => {
	let server;
	beforeAll(() => {
		server = require('../../../index');
	});
	afterAll(async () => {
		await mongoose.connection.close();
		await server.close();
	});

    describe('GET /api/reviews/restaurant/:id', () => {
        let review;
        let user;
        let restaurant;
        let restaurantId;
        let profile;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;
            
            // create customer 
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            await profile.save();

            // create a review
            review = createTestReview(profile, restaurant);
            await review.save();
		});

        const exec = () => {
            return request(server)
            .get(`/api/reviews/restaurant/${restaurantId}`);
        };

        it('should return 400 if invalid ID', async () => {
            restaurantId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if restaurant does not exist', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.forEach(review => {    
                expect(review).toHaveProperty('username');
                expect(review).toHaveProperty('rating');
                expect(review).toHaveProperty('reviewText');
                expect(review).toHaveProperty('dateVisited');
                expect(review).toHaveProperty('createdAt');
                expect(review).toHaveProperty('badgesCount');
                expect(review).toHaveProperty('isVisible');
            });
        });
	});

    describe('GET /api/reviews/customer/:id', () => {
        let review;
        let user;
        let restaurant;
        let profile;
        let customerId;

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
            customerId = profile._id;

            // create a review
            review = createTestReview(profile, restaurant);
            await review.save();
		});

        const exec = () => {
            return request(server)
            .get(`/api/reviews/customer/${customerId}`);
        };

        it('should return 400 if invalid ID', async () => {
            customerId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if customer does not exist', async () => {
            customerId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.forEach(review => {    
                expect(review).toHaveProperty('username');
                expect(review).toHaveProperty('rating');
                expect(review).toHaveProperty('reviewText');
                expect(review).toHaveProperty('dateVisited');
                expect(review).toHaveProperty('createdAt');
                expect(review).toHaveProperty('badgesCount');
                expect(review).toHaveProperty('isVisible');
            });
        });
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
            const requiredKeys = [
                'username', 'rating', 'reviewText', 'dateVisited',
                'createdAt', 'isVisible'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
	});

    describe('POST /api/reviews/:id', () => {
        let user;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let cookie;

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
            cookie = setTokenCookie(token);
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
            .set('Cookie', [cookie])
            .send({
                restaurant: restaurant._id,
                rating, reviewText, dateVisited
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
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
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
            const requiredKeys = [
                'username', 'rating', 'reviewText', 'dateVisited',
                'createdAt', 'isVisible'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
	});

    describe('POST /api/reviews/:id/reply', () => {
        let review;
        let reviewId;
        let customer;
        let owner;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let replyText;
        let token;
        let cookie;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create restaurant owner
            owner = await createTestUser('owner');
            await owner.save();
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            
            // create customer 
            customer = await createTestUser('customer');
            profile = createTestCustomerProfile(customer);
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            dateVisited = Date.now();
            review = new Review({
                customer: profile._id,
                username: customer.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited
            });
            await review.save();
            reviewId = review._id;
            replyText = "test";
		});

        const exec = () => {
            return request(server)
            .post(`/api/reviews/${reviewId}/reply`)
            .set('Cookie', [cookie])
            .send({
                replyText
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
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if invalid request', async () => {
            replyText = null;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            const requiredKeys = [
                'username', 'rating', 'reviewText', 'dateVisited',
                'createdAt', 'isVisible'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            if (res.body.reply) {
                expect(res.body.reply).toHaveProperty('replyText');
            }
        });
	});

    describe('POST /api/reviews/:id/badges', () => {
        let review;
        let reviewId;
        let customer;
        let owner;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let token;
        let cookie;
        let badgeIndex;
        let badgeVote;
        let otherCustomer;
        let otherCustomerProfile;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create restaurant owner
            owner = await createTestUser('owner');
            await owner.save();

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            
            // create customer 
            customer = await createTestUser('customer');
            profile = createTestCustomerProfile(customer);
            customer.profile = profile._id;
            await customer.save();
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            replyText = "test";
            dateVisited = Date.now();
            review = new Review({
                customer: profile._id,
                username: customer.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited,
                reply: {
                    owner: owner._id,
                    replyText: replyText
                }
            });
            await review.save();
            reviewId = review._id;
            badgeIndex = 0;

            // create other customer
            otherCustomer = await createTestUser('customer');
            otherCustomerProfile = createTestCustomerProfile(otherCustomer);
            otherCustomer.profile = otherCustomerProfile._id;
            await otherCustomer.save();
            await otherCustomerProfile.save();
            token = generateAuthToken(otherCustomer);
            cookie = setTokenCookie(token);
		});

        const exec = () => {
            return request(server)
            .post(`/api/reviews/${reviewId}/badges`)
            .set('Cookie', [cookie])
            .send({
                badgeIndex
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
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if invalid request', async () => {
            badgeIndex = 5;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and badgeIndex', async () => {
            const res = await exec();
            expect(typeof res.body).toBe('number');
        });
	});

    describe('DELETE /api/reviews/:id', () => {
        let review;
        let reviewId;
        let user;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let images;
        let token;
        let cookie;

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

            profile = createTestCustomerProfile(user);
            await profile.save();
            user.profile = profile._id;
            await user.save();

            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create a review
            rating = 3;
            reviewText = "Good";
            dateVisited = Date.now();
            images = [];
            review = new Review({
                customer: profile._id,
                username: user.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited, images
            });
            await review.save();
            reviewId = review._id;
		});

        const exec = () => {
            return request(server)
            .delete(`/api/reviews/${reviewId}`)
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

        it('should return 403 if owner', async () => {
            let owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if review does not belong to user', async () => {
            let otherCustomer = await createTestUser('customer');
            await otherCustomer.save();
            token = generateAuthToken(otherCustomer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 and delete the review from the database', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            const requiredKeys = [
                'username', 'rating', 'reviewText', 'dateVisited',
                'createdAt', 'isVisible'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));

            const reviewInDb = await Review.findById(res.body._id);
            expect(reviewInDb).toBeNull();
        });
	});

    describe('DELETE /api/reviews/:id/reply', () => {
        let review;
        let reviewId;
        let customer;
        let owner;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let replyText;
        let token;
        let cookie;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create restaurant owner
            owner = await createTestUser('owner');
            await owner.save();
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            
            // create customer 
            customer = await createTestUser('customer');
            profile = createTestCustomerProfile(customer);
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            replyText = "test";
            dateVisited = Date.now();
            review = new Review({
                customer: profile._id,
                username: customer.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited,
                reply: {
                    owner: owner._id,
                    replyText: replyText
                }
            });
            await review.save();
            reviewId = review._id;
		});

        const exec = () => {
            return request(server)
            .delete(`/api/reviews/${reviewId}/reply`)
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

        it('should return 403 if customer', async () => {
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'username', 'rating', 'reviewText', 'dateVisited',
                'createdAt', 'isVisible'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.reply).toBeUndefined();
        });
	});

    describe('DELETE /api/reviews/:id/badges', () => {
        let review;
        let reviewId;
        let customer;
        let owner;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let token;
        let cookie;
        let badgeIndex;
        let badgeVote;
        let otherCustomer;
        let otherCustomerProfile;

		beforeEach(async () => {
			// clear all
			await Review.deleteMany({});
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create restaurant owner
            owner = await createTestUser('owner');
            await owner.save();

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            
            // create customer 
            customer = await createTestUser('customer');
            profile = createTestCustomerProfile(customer);
            customer.profile = profile._id;
            await customer.save();
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";
            replyText = "test";
            dateVisited = Date.now();
            review = new Review({
                customer: profile._id,
                username: customer.username,
                restaurant: restaurant._id,
                rating, reviewText, dateVisited,
                reply: {
                    owner: owner._id,
                    replyText: replyText
                }
            });
            await review.save();
            reviewId = review._id;
            badgeIndex = 0;

            // create other customer
            otherCustomer = await createTestUser('customer');
            otherCustomerProfile = createTestCustomerProfile(otherCustomer);
            otherCustomer.profile = otherCustomerProfile._id;
            await otherCustomer.save();
            await otherCustomerProfile.save();
            token = generateAuthToken(otherCustomer);
            cookie = setTokenCookie(token);

            // create badgeIndex vote
            badgeVote = await ReviewBadgeVote({
                customer: otherCustomerProfile._id,
                review: review._id,
                restaurant: restaurant._id,
                badgeIndex
            });
            await badgeVote.save();
		});

        const exec = () => {
            return request(server)
            .delete(`/api/reviews/${reviewId}/badges`)
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

        it('should return 403 if owner', async () => {
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if review does not exist', async () => {
            reviewId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and badgeIndex', async () => {
            const res = await exec();
            expect(typeof res.body).toBe('number');

            const voteInDb = await ReviewBadgeVote.findById(reviewId);
            expect(voteInDb).toBeNull();
        });
	});
});