import RewardPoint from '../../../models/rewardPoint.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestRewardPoint } from '../../factories/rewardPoint.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import request from 'supertest';
import mongoose from 'mongoose';
import Restaurant from '../../../models/restaurant.model.js';

describe('reward point test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/rewards/points', () => {
        let rewardPoint;
        let user, profile, token, cookie;

        beforeEach(async () => {
            await RewardPoint.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user._id);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            rewardPoint = createTestRewardPoint(new mongoose.Types.ObjectId(), profile._id);
            await rewardPoint.save();
            rewardPoint = createTestRewardPoint(new mongoose.Types.ObjectId(), profile._id);
            await rewardPoint.save();
        });

        const exec = () => {
            return request(server)
                .get('/api/rewards/points')
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and all reward points', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.points.forEach(point => {    
                const requiredKeys = ['customer', 'restaurant', 'points'];
                expect(Object.keys(point)).toEqual(expect.arrayContaining(requiredKeys));
            });
        });
    });

    describe('GET /api/rewards/restaurant/:id/points', () => {
        let rewardPoint;
        let restaurant, restaurantId;
        let user, profile, token, cookie;

        beforeEach(async () => {
            await RewardPoint.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user._id);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant();
            restaurantId = restaurant._id
            await restaurant.save();

            rewardPoint = createTestRewardPoint(restaurantId, profile._id);
            await rewardPoint.save();
        });

        const exec = () => {
            return request(server)
                .get(`/api/rewards/restaurant/${restaurantId}/points`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and reward point', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['customer', 'restaurant', 'points'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/rewards/restaurant/:id/points', () => {
        let user, change, username;
        let restaurant, restaurantId, staff;
        let token, cookie;

        beforeEach(async () => {
            await RewardPoint.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('customer');
            await user.save();
            username = user.username;

            restaurant = createTestRestaurant();
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            restaurantId = restaurant._id;
            await restaurant.save();
            await staff.save();

            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            change = 100;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/rewards/restaurant/${restaurantId}/points`)
                .set('Cookie', [cookie])
                .send({
                    username, change
                })
        };

        it('should return 400 and if deducting from insufficient balance', async () => {
            change = -150;
            const res = await exec();
            expect(res.status).toBe(400);
        });
        
        it('should return 200 and true if valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toBe(true);
        });
    });
});