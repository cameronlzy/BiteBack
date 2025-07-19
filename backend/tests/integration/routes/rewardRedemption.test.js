import RewardRedemption from '../../../models/rewardRedemption.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import RewardItem from '../../../models/rewardItem.model.js';
import Staff from '../../../models/staff.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestRewardRedemption } from '../../factories/rewardRedemption.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { createTestRewardItem } from '../../factories/rewardItem.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import request from 'supertest';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import RewardPoint from '../../../models/rewardPoint.model.js';

describe('reward redemption test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/rewards/redemptions', () => {
        let user, profile, token, cookie;
        let rewardRedemption, rewardItem, status;

        beforeEach(async () => {
            await RewardRedemption.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            rewardItem = createTestRewardItem();
            await rewardItem.save();

            rewardRedemption = createTestRewardRedemption(profile._id, new mongoose.Types.ObjectId(), rewardItem);
            await rewardRedemption.save();

            rewardRedemption = createTestRewardRedemption(profile._id, new mongoose.Types.ObjectId(), rewardItem);
            rewardRedemption.status = 'expired';
            await rewardRedemption.save();
            status = 'active,activated';
        });

        const exec = () => {
            return request(server)
                .get(`/api/rewards/redemptions?status=${status}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and all active reward redemptions', async () => {
            status = 'active';
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.redemptions.forEach(redemption => {    
                const requiredKeys = ['customer', 'restaurant', 'rewardItemSnapshot', 'status'];
                expect(Object.keys(redemption)).toEqual(expect.arrayContaining(requiredKeys));
                expect(redemption.status).toBe(status);
            });
            expect(res.body.redemptions.length).toBe(1);
        });

        it('should return 200 and all reward redemptions', async () => {
            status = 'active,expired';
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.redemptions.forEach(redemption => {    
                const requiredKeys = ['customer', 'restaurant', 'rewardItemSnapshot', 'status'];
                expect(Object.keys(redemption)).toEqual(expect.arrayContaining(requiredKeys));
            });
            expect(res.body.redemptions.length).toBe(2);
        });
    });

    describe('GET /api/rewards/redemptions/:id', () => {
        let user, profile, token, cookie;
        let rewardRedemption, rewardItem, rewardRedemptionId;

        beforeEach(async () => {
            await RewardRedemption.deleteMany({});
            await Restaurant.deleteMany({});
            await RewardItem.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            rewardItem = createTestRewardItem();
            await rewardItem.save();

            rewardRedemption = createTestRewardRedemption(profile._id, new mongoose.Types.ObjectId(), rewardItem);
            await rewardRedemption.save();
            rewardRedemptionId = rewardRedemption._id;
        });

        const exec = () => {
            return request(server)
                .get(`/api/rewards/redemptions/${rewardRedemptionId}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and reward redemptions', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['customer', 'restaurant', 'rewardItemSnapshot', 'status'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/rewards/redemptions', () => {
        let user, profile, token, cookie;
        let rewardItem, rewardItemId, rewardPoint;

        beforeEach(async () => {
            await RewardItem.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            rewardItem = createTestRewardItem();
            rewardItem.stock = 10;
            rewardItem.pointsRequired = 100;
            await rewardItem.save();
            rewardItemId = rewardItem._id;

            rewardPoint = new RewardPoint({
                customer: profile._id, restaurant: rewardItem.restaurant, points: 150
            });
            await rewardPoint.save();
        });

        const exec = () => {
            return request(server)
                .post('/api/rewards/redemptions')
                .set('Cookie', [cookie])
                .send({
                    rewardItem: rewardItemId
                });
        };

        it('should return 404 if reward item does not exist', async () => {
            rewardItemId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if no stock', async () => {
            rewardItem.stock = 0;
            await rewardItem.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if insufficient balance', async () => {
            rewardPoint.points = 50;
            await rewardPoint.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        
        it('should return 200 and reward redemptions', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['customer', 'restaurant', 'rewardItemSnapshot', 'status'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            const rewardPointInDb = await RewardPoint.findOne({ customer: profile._id, restaurant: rewardItem.restaurant });
            expect(rewardPointInDb.points).toBe(50);
            const rewardItemInDb = await RewardItem.findById(rewardItemId);
            expect(rewardItemInDb.stock).toBe(9);
        });
    });

    describe('PATCH /api/rewards/redemptions/complete', () => {
        let token, cookie;
        let rewardRedemption, rewardItem, code;
        let restaurant, staff;

        beforeEach(async () => {
            await RewardRedemption.deleteMany({});
            await Restaurant.deleteMany({});
            await RewardItem.deleteMany({});
            await Restaurant.deleteMany({});
            await Staff.deleteMany({});

            restaurant = createTestRestaurant();
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);
            await restaurant.save();
            await staff.save();

            rewardItem = createTestRewardItem(restaurant._id);
            await rewardItem.save();

            rewardRedemption = createTestRewardRedemption(new mongoose.Types.ObjectId(), restaurant._id, rewardItem);
            rewardRedemption.activatedAt = new Date();
            rewardRedemption.status = 'activated';
            code = '123456';
            rewardRedemption.code = code;
            await rewardRedemption.save();
        });

        const exec = () => {
            return request(server)
                .patch('/api/rewards/redemptions/complete')
                .set('Cookie', [cookie])
                .send({
                    code
                });
        };

        it('should return 400 if invalid code', async () => {
            code = '111111';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 403 if wrong staff', async () => {
            const otherStaff = await createTestStaff();
            token = staffGenerateAuthToken(otherStaff);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 410 if expired', async () => {
            rewardRedemption.activatedAt = DateTime.utc().minus({ days: 1}).toJSDate();
            await rewardRedemption.save();
            const res = await exec();
            expect(res.status).toBe(410);
        });
        
        it('should return 200 and message', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.message).not.toBe(undefined);
        });
    });

    describe('PATCH /api/rewards/redemptions/:id', () => {
        let user, profile, token, cookie;
        let rewardRedemption, rewardItem, rewardRedemptionId;

        beforeEach(async () => {
            await RewardRedemption.deleteMany({});
            await Restaurant.deleteMany({});
            await RewardItem.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            rewardItem = createTestRewardItem();
            await rewardItem.save();

            rewardRedemption = createTestRewardRedemption(profile._id, new mongoose.Types.ObjectId(), rewardItem);
            await rewardRedemption.save();
            rewardRedemptionId = rewardRedemption._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/rewards/redemptions/${rewardRedemptionId}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and activate redemption', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['customer', 'restaurant', 'rewardItemSnapshot', 'activatedAt', 'status', 'code'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.status).toBe('activated');
            expect(res.body.activatedAt).not.toBe(undefined);
            expect(typeof res.body.code).toBe('string');
        });
    });
});