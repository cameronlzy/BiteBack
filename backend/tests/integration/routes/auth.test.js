import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import config from 'config';
import cookieParser from 'cookie';

import User from '../../../models/user.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import CustomerProfile from '../../../models/customerProfile.model.js';
import OwnerProfile from '../../../models/ownerProfile.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import Staff from '../../../models/staff.model.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';

describe('auth test', () => {
    let server;
    beforeAll(async () => {
        const mod = await import('../../../index.js');
        server = mod.default;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('POST /api/auth/forget-password', () => {
        let email;
        let user;
        let username;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/forget-password')
            .send({
                email
            });
        };
    
        beforeEach(async () => {
            await User.deleteMany({});
            user = await createTestUser('customer');
            user.email = "test@email.com";
            await user.save();
            username = user.username;
            email = user.email;
        });

        it('should return 400 if username/email does not belong to anyone', async () => {
            email = "otherEmail@gamil.com"
            const res = await exec();
            expect(res.status).toBe(400);
        });

        // skip to avoid spamming emails
        it.skip('should return 200 and send email when using username', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        // skip to avoid spamming emails
        it.skip('should return 200 and send email when using username', async () => {
            const exec = () => {
                return request(server)
                .post('/api/auth/forget-password')
                .send({
                    username
                });
            };
            const res = await exec();
            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        let user;
        let password;
        let userId;
        let token;
        let hash;
    
        const exec = () => {
            return request(server)
            .post(`/api/auth/reset-password/${token}`)
            .send({
                password
            });
        };
    
        beforeEach(async () => {
            await User.deleteMany({});
            user = await createTestUser('customer');
            userId = user._id;
            password = "newPassword@123"

            // create token
            token = crypto.randomBytes(32).toString('hex');
            hash = crypto.createHash('sha256').update(token).digest('hex');
            user.resetPasswordToken = hash;
            user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
            await user.save();
        });

        it('should return 400 if username/email does not belong to anyone', async () => {
            let otherToken = crypto.randomBytes(32).toString('hex');
            let otherHash = crypto.createHash('sha256').update(otherToken).digest('hex');
            token = otherToken;
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 200 and change the password', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            let updatedUser = await User.findById(userId).select('password').lean();
            const isMatch = await bcrypt.compare('newPassword@123', updatedUser.password);
            expect(isMatch).toBe(true);
        });
    });

    describe('PUT /api/auth/change-password', () => {
        let user;
        let oldPassword;
        let password;
        let token;
        let cookie;
    
        const exec = () => {
            return request(server)
            .put('/api/auth/change-password')
            .set('Cookie', [cookie])
            .send({
                oldPassword, password
            });
        };
    
        beforeEach(async () => {
            await User.deleteMany({});

            // create user with password: Password@123
            user = await createTestUser('customer');
            await user.save();

            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
            password = "Password@1234";
            oldPassword = "Password@123";
        });
    
        it('should return 401 if no token', async () => {
            cookie = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });
    
        it('should return 401 if invalid token', async () => {
            token = 'invalid-token';
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(401);
        });
    
        it('should return 400 if wrong password', async () => {
            oldPassword = "wrongPassword";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if user does not exist', async () => {
            let otherUser = await createTestUser('customer');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            oldPassword = "wrongPassword";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 200 for valid request and change the password', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            const updatedUser = await User.findById(user._id);
            const isMatch = await bcrypt.compare(password, updatedUser.password);

            expect(isMatch).toBe(true);
        });

        it('should return valid jwtToken', async () => {
            const res = await exec();
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();

            const parsed = cookieParser.parse(cookies[0]);
            const token = parsed.token;
            expect(token).toBeDefined();
    
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(decoded)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/auth/register - for customer', () => {
        let email;
        let username;
        let password;
        let role;

        let name;
        let contactNumber;
        let favCuisines;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/register')
            .send({
                email, username, password, role, name, contactNumber, favCuisines
            });
        };
    
        beforeEach(async () => { 
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});
            email = "myCustomer@gmail.com";
            username = "myCustomer";
            password = "myPassword@123";
            role = "customer";
            name = "name";
            contactNumber = "87654321";
            favCuisines = ["Chinese"];
        });
    
        it('should return 400 if the request has invalid email', async () => {
            email = "email";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if the request has short username', async () => {
            username = "a";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if the request has simple password', async () => {
            password = "password";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if the request had invalid contact number', async () => {
            contactNumber = "a";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if the user exists', async () => {
            await exec();
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 200 + username, email, role', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                '_id', 'email', 'username', 'role'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return create a customer profile', async () => {
            const res = await exec();
            const user = await User.findOne({ email: email })
                .populate('profile');
            const requiredKeys = [
                'name',
                'contactNumber', 
                'favCuisines',
                'points',
                'dateJoined'
            ];
            expect(Object.keys(user.profile.toObject())).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/auth/register - for owner', () => {
        let email;
        let username;
        let password;
        let role;
        let companyName;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/register')
            .send({
                email, username, password, role, companyName
            });
        };
    
        beforeEach(async () => { 
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // creating a owner
            email = "myOwner@gmail.com";
            username = "myOwner";
            password = "myPassword@123";
            role = "owner";
            companyName = "name";
        });

        it('should return 400 if the request has invalid email', async () => {
            email = "email";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if the request has short username', async () => {
            username = "a";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if the request has simple password', async () => {
            password = "password";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if the user exists', async () => {
            await exec();
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 200 and username, email, role', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                '_id', 'email', 'username', 'role'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return create a owner profile', async () => {
            const res = await exec();
            const user = await User.findOne({ email: email })
                .populate('profile');
            const requiredKeys = [
                'companyName', 'restaurants', 'dateJoined'
            ];
            expect(Object.keys(user.profile.toObject())).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/auth/login', () => {
        let email;
        let username;
        let password;
        let role;
        let user;
        let hashedPassword;
        let roleProfile;
    
        const emailLogin = () => {
            return request(server)
            .post('/api/auth/login')
            .send({
                email, password
            });
        };
    
        const usernameLogin = () => {
            return request(server)
            .post('/api/auth/login')
            .send({
                username, password
            });
        };
    
        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});
            email = "myEmail@gmail.com";
            username = "username";
            password = "myPassword@123";
            role = "customer";
            roleProfile = "CustomerProfile";
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt); 
            user = new User({
                email, username, password: hashedPassword, role, roleProfile,
                profile: new mongoose.Types.ObjectId(),
            });
            await user.save();
        });
    
        it('should return 400 if invalid request', async () => {
            email = "";
            const res = await emailLogin();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if user not found', async () => {
            email = "wrongEmail@gmail.com";
            const res = await emailLogin();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if wrong password', async () => {
            password = "wrongPassword";
            const res = await emailLogin();
            expect(res.status).toBe(400);
        });
    
        it('should return 200 when logging in through email for customer', async () => {
            const res = await emailLogin();
            expect(res.status).toBe(200);
        });
    
        it('should return 200 when logging in through email for owner', async () => {
            role = "owner";
            roleProfile = "OwnerProfile";
            username = "myOwner";
            email = "myOwner@gmail.com";
            user = new User({
                email, username, password: hashedPassword, role, roleProfile,
                profile: new mongoose.Types.ObjectId(),
            });
            await user.save();
            const res = await emailLogin();
            expect(res.status).toBe(200);
        });
    
        it('should return 200 when logging in through username for customer', async () => {
            const res = await usernameLogin();
            expect(res.status).toBe(200);
        });
    
        it('should return username, email, role', async () => {
            const res = await usernameLogin();
            const requiredKeys = [
                '_id', 'email', 'username', 'role'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body).not.toHaveProperty('password');
        });
    
        it('should return valid jwtToken', async () => {
            const res = await usernameLogin();
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();

            const parsed = cookieParser.parse(cookies[0]);
            const token = parsed.token;
            expect(token).toBeDefined();
    
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(decoded)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/auth/login/staff', () => {
        let username;
        let password;
        let role;
        let hashedPassword;
        let restaurant;
        let staff;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/login/staff')
            .send({
                username, password
            });
        };
    
        beforeEach(async () => {
            await Staff.deleteMany({});

            username = "username";
            password = "myPassword@123";
            role = "staff";
            restaurant = new mongoose.Types.ObjectId();
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt); 
            staff = new Staff({
                username, password: hashedPassword, role, restaurant
            });
            await staff.save();
        });
    
        it('should return 400 if invalid request', async () => {
            username = "";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if user not found', async () => {
            username = "wrongUsername";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 400 if wrong password', async () => {
            password = "wrongPassword";
            const res = await exec();
            expect(res.status).toBe(400);
        });
    
        it('should return 200', async () => {
            const res = await exec();
            expect(res.status).toBe(200);

            const requiredKeys = [
                '_id', 'username', 'role', 'restaurant'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body).not.toHaveProperty('password');
        });
    
        it('should return valid jwtToken', async () => {
            const res = await exec();
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();

            const parsed = cookieParser.parse(cookies[0]);
            const token = parsed.token;
            expect(token).toBeDefined();
    
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            const requiredKeys = [
                '_id', 'username', 'role', 'restaurant'
            ];
            expect(Object.keys(decoded)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });
});
