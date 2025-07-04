import request from 'supertest';
import mongoose from 'mongoose';
import Review from '../../../models/review.model.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { createTestVisitHistory } from '../../factories/visitHistory.factory.js';
import { createTestReview } from '../../factories/review.factory.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import User from '../../../models/user.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import CustomerProfile from '../../../models/customerProfile.model.js';
import OwnerProfile from '../../../models/ownerProfile.model.js';
import ReviewBadgeVote from '../../../models/reviewBadgeVote.model.js';
import RewardPoint from '../../../models/rewardPoint.model.js';
import VisitHistory from '../../../models/visitHistory.model.js';
import { DateTime } from 'luxon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('review test', () => {
	let server;
	beforeAll(async () => {
        server = await serverPromise;
    });
	afterAll(async () => {
		await mongoose.connection.close();
		await server.close();
	});

    describe('GET /api/reviews/eligible-visits', () => {
        let visitHistory;
        let user, token, cookie;
        let restaurant;
        let restaurantId;
        let profile;

		beforeEach(async () => {
			// clear all
            await CustomerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            await VisitHistory.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;
            
            // create customer 
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            await profile.save();
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            visitHistory = new VisitHistory({
                customer: profile._id, restaurant: restaurantId, 
                visits: [
                    { visitDate: new Date() },
                    { visitDate: DateTime.now().minus({ days: 1 }).toJSDate(), reviewed: true }
                ]
            });
            await visitHistory.save();
		});

        const exec = () => {
            return request(server)
            .get(`/api/reviews/eligible-visits?restaurantId=${restaurantId}`)
            .set('Cookie', [cookie]);
        };

        it('should return 404 if restaurant does not exist', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and correct visit date', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].visitDate).not.toBeUndefined();
        });
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
            review = createTestReview(profile, restaurantId);
            await review.save();
		});

        const exec = () => {
            return request(server)
            .get(`/api/reviews/restaurant/${restaurantId}`);
        };

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
            review = createTestReview(profile, restaurant._id);
            await review.save();
		});

        const exec = () => {
            return request(server)
            .get(`/api/reviews/customer/${customerId}`);
        };

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
            dateVisited = new Date();
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

    describe('POST /api/reviews', () => {
        let user;
        let restaurant;
        let profile;
        let rating;
        let reviewText;
        let dateVisited;
        let cookie;
        let token;
        let visitHistory;

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
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
            await profile.save();

            // create a review
            rating = 3;
            reviewText = "Good";

            visitHistory = createTestVisitHistory(restaurant._id, profile._id);
            await visitHistory.save();
            dateVisited = visitHistory.visits[0].visitDate.toISOString();
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

        it('should return 400 if invalid request', async () => {
            rating = 6;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'username', 'rating', 'reviewText', 'dateVisited',
                'createdAt', 'isVisible'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            const points = await RewardPoint.findOne({ customer: profile._id, restaurant: restaurant._id });
            expect(points.points).toBe(50);
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
            dateVisited = new Date();
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
        let otherCustomer;
        let otherCustomerProfile;
        let replyText;

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
            dateVisited = new Date();
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

    describe('POST /api/reviews/:id/images', () => {
        let user, token, cookie, profile;
        let review, reviewId;
        let restaurant;
        let filePath;

        beforeEach(async () => {
            await Review.deleteMany({});
            await User.deleteMany({});
            await Restaurant.deleteMany({});

            // create customer
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            await user.save();
            await profile.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user._id);
            await restaurant.save();

            // create review
            review = createTestReview(profile, restaurant._id);
            await review.save();
            reviewId = review._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .post(`/api/reviews/${reviewId}/images`)
            .set('Cookie', [cookie])
            .attach('images', filePath);
        };

        it('should return 403 if review does not belong to user', async () => {
            let otherUser = await createTestUser('customer');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await request(server)
                .post(`/api/reviews/${reviewId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(403);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('images');
            expect(Array.isArray(res.body.images)).toBe(true);

            const allStrings = res.body.images.every(url => typeof url === 'string');
            expect(allStrings).toBe(true);
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
            dateVisited = new Date();
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
                'rating', 'reviewText', 'dateVisited',
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
            dateVisited = new Date();
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

        it('should return 200 and review object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'rating', 'reviewText', 'dateVisited',
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
        let replyText;

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
            dateVisited = new Date();
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