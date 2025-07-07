import mongoose from 'mongoose';
import RewardPoint from '../../../models/rewardPoint.model.js';
import { adjustPoints } from '../../../services/rewardPoint.service.js';
import { serverPromise } from '../../../index.js';

describe('reward point service test', () => {
    let server;

    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('adjustPoints test', () => {
        let customer, restaurant;

        beforeEach(async () => {
            await RewardPoint.deleteMany({});
            restaurant = new mongoose.Types.ObjectId();
            customer = new mongoose.Types.ObjectId();
        });

        it('should create a new RewardPoint when none exists and change is positive', async () => {
            const result = await adjustPoints(50, restaurant, customer);
            expect(result).toBe(true);

            const doc = await RewardPoint.findOne({ restaurant, customer });
            expect(doc).not.toBeNull();
            expect(doc.points).toBe(50);
        });

        it('should not create RewardPoint if change is negative and none exists', async () => {
            const result = await adjustPoints(-20, restaurant, customer);
            expect(result).toBe(false);

            const doc = await RewardPoint.findOne({ restaurant, customer });
            expect(doc).toBeNull();
        });

        it('should increment points if RewardPoint exists', async () => {
            await adjustPoints(30, restaurant, customer);
            const result = await adjustPoints(20, restaurant, customer);

            expect(result).toBe(true);

            const doc = await RewardPoint.findOne({ restaurant, customer });
            expect(doc.points).toBe(50);
        });

        it('should decrement points if balance is sufficient', async () => {
            await adjustPoints(40, restaurant, customer);
            const result = await adjustPoints(-15, restaurant, customer);

            expect(result).toBe(true);

            const doc = await RewardPoint.findOne({ restaurant, customer });
            expect(doc.points).toBe(25);
        });

        it('should not decrement points if balance is insufficient', async () => {
            await adjustPoints(10, restaurant, customer);
            const result = await adjustPoints(-20, restaurant, customer);

            expect(result).toBe(false);

            const doc = await RewardPoint.findOne({ restaurant, customer});
            expect(doc.points).toBe(10);
        });
    });
});
