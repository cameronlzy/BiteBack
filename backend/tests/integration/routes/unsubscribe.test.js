import request from 'supertest';
import mongoose from 'mongoose';
import User from '../../../models/user.model.js';
import CustomerProfile from '../../../models/customerProfile.model.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { createTestUser } from '../../factories/user.factory.js';
import { generateUnsubscribeToken } from '../../../helpers/token.helper.js';
import { serverPromise } from '../../../index.js';

describe('unsubscribe test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/unsubscribe', () => {
        let user, profile, token;

        beforeEach(async () => { 
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});
            
            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user._id);
            user.profile = profile._id;
            await user.save();
            await profile.save();

            token = generateUnsubscribeToken(profile._id);
        });

        const exec = () => {
            return request(server)
            .get(`/api/unsubscribe?token=${token}`);
        };

        it('should return 404 if invalid token', async () => {
            token = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 404 if the user not found', async () => {
            token = generateUnsubscribeToken(new mongoose.Types.ObjectId());
            const res = await exec();
            expect(res.status).toBe(404);
        });
    
        it('should return 200 and opt out of email', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const customerInDB = await CustomerProfile.findById(profile._id).lean();
            expect(customerInDB.emailOptOut).toBe(true);
        });
    });
});
