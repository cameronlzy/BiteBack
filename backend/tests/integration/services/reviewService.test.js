import mongoose from 'mongoose';
import Review from '../../../models/review.model.js';
import ReviewBadgeVote from '../../../models/reviewBadgeVote.model.js';
import * as reviewService from '../../../services/review.service.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';

describe('review test', () => {
    let server;
    beforeAll(async () => {
        const mod = await import('../../../index.js');
        server = mod.default;
    });
    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('getBadgesCount service test', () => {
        let reviews;
        let review1;
        let review2;

        beforeEach(async () => {
            await Review.deleteMany({});
            await ReviewBadgeVote.deleteMany({});

            // create 2 reviews
            review1 = new Review({
                customer: new mongoose.Types.ObjectId(),
                username: 'user1',
                restaurant: new mongoose.Types.ObjectId(),
                rating: 3, 
                reviewText: 'Test',
                dateVisited: Date.now(),
            })
            await review1.save();
            review2 = new Review({
                customer: new mongoose.Types.ObjectId(),
                username: 'user2',
                restaurant: new mongoose.Types.ObjectId(),
                rating: 5, 
                reviewText: 'Test',
                dateVisited: Date.now(),
            })
            await review2.save();
            reviews = [review1.toObject(), review2.toObject()];

            // add 3 badge votes to one review
            await ReviewBadgeVote.create([
                { review: review1._id, badgeIndex: 0, customer: new mongoose.Types.ObjectId(), restaurant: new mongoose.Types.ObjectId() },
                { review: review1._id, badgeIndex: 1, customer: new mongoose.Types.ObjectId(), restaurant: new mongoose.Types.ObjectId() },
                { review: review1._id, badgeIndex: 2, customer: new mongoose.Types.ObjectId(), restaurant: new mongoose.Types.ObjectId() },
            ]);
        });

        it('should return reviews with correct badgesCount', async () => {
            const result = await reviewService.getBadgesCount(reviews);
            expect(result).toHaveLength(2);
            expect(result[0].badgesCount).toEqual([1, 1, 1, 0]);
        });

        it('should return [0, 0, 0, 0] for reviews with no badge votes', async () => {
            const result = await reviewService.getBadgesCount(reviews);
            expect(result[1].badgesCount).toEqual([0, 0, 0, 0]);
        });
    });

    describe('getUserBadgeVotes service test', () => {
        let reviews;
        let user;
        let profile;

        beforeEach(async () => {
            await ReviewBadgeVote.deleteMany({});

            reviews = [
                { _id: new mongoose.Types.ObjectId() },
                { _id: new mongoose.Types.ObjectId() },
                { _id: new mongoose.Types.ObjectId() },
            ];
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;

            // create some votes
            await ReviewBadgeVote.create([
                { review: reviews[0]._id, customer: profile._id, restaurant: new mongoose.Types.ObjectId(), badgeIndex: 0 },
                { review: reviews[1]._id, customer: profile._id, restaurant: new mongoose.Types.ObjectId(), badgeIndex: 1 },
                { review: new mongoose.Types.ObjectId(), customer: profile._id, restaurant: new mongoose.Types.ObjectId(), badgeIndex: 2 },
            ]);
        });

        it('should return reviews with selectedBadge set to user has no votes', async() => {
            const result = await reviewService.getUserBadgeVotes(reviews, { profile: new mongoose.Types.ObjectId() });
            expect(result.every(r => r.selectedBadge === null)).toBe(true);
        });

        it('should correctly map user votes to reviews', async() => {
            const result = await reviewService.getUserBadgeVotes(reviews, user);
            expect(result.find(r => r._id.equals(reviews[0]._id)).selectedBadge).toBe(0);
            expect(result.find(r => r._id.equals(reviews[1]._id)).selectedBadge).toBe(1);
            expect(result.find(r => ![reviews[0]._id.toString(), reviews[1]._id.toString()].includes(r._id.toString())).selectedBadge).toBe(null);
        });
    });

    describe('getAverageRatingForRestaurants service test', () => {
        let restaurant1;
        let restaurant2;
        let restaurants;

        beforeEach(async () => {
            await ReviewBadgeVote.deleteMany({});
            await Review.deleteMany({});

            // create restaurants
            restaurant1 = createTestRestaurant();
            restaurant2 = createTestRestaurant();
            restaurants = [
                restaurant1.toObject(), restaurant2.toObject(),
            ];

            // create reviews
            await Review.create([
                { 
                    customer: new mongoose.Types.ObjectId(),
                    username: "username",
                    restaurant: restaurant1._id, 
                    rating: 5, reviewText: "test", 
                    dateVisited: Date.now() 
                },
                { 
                    customer: new mongoose.Types.ObjectId(),
                    username: "username",
                    restaurant: restaurant1._id, 
                    rating: 3, reviewText: "test", 
                    dateVisited: Date.now() 
                },
                { 
                    customer: new mongoose.Types.ObjectId(),
                    username: "username",
                    restaurant: restaurant2._id, 
                    rating: 3, reviewText: "test", 
                    dateVisited: Date.now() 
                },
            ]);
        });

        it('should return the correct average rating and review count', async () => {
            const result = await reviewService.getAverageRatingsForRestaurants(restaurants);
            expect(result[0].averageRating).toBe(4);
            expect(result[0].reviewCount).toBe(2);
            expect(result[1].averageRating).toBe(3);
            expect(result[1].reviewCount).toBe(1);
        });

        it('should return the 0 for average rating and review count if no reviews', async () => {
            restaurants = [ createTestRestaurant().toObject() ];
            const result = await reviewService.getAverageRatingsForRestaurants(restaurants);
            expect(result[0].averageRating).toBe(0);
            expect(result[0].reviewCount).toBe(0);
        });
    });
});