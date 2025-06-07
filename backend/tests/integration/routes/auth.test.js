const request = require('supertest');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const cookie = require('cookie');
const User = require('../../../models/user.model');
const { createTestUser } = require('../../factories/user.factory');
const { createTestRestaurant } = require('../../factories/restaurant.factory');
const { generateAuthToken } = require('../../../services/user.service');
const CustomerProfile = require('../../../models/customerProfile.model');
const OwnerProfile = require('../../../models/ownerProfile.model');
const Restaurant = require('../../../models/restaurant.model');

describe.skip('auth test', () => {
    let server;
    beforeAll(() => {
        server = require('../../../index');
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
            user.email = "zhihui1306@gmail.com";
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

    describe('POST /api/auth/register/customer', () => {
        let email;
        let username;
        let password;
        let role;

        let name;
        let contactNumber;
        let favCuisines;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/register/customer')
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

    describe('POST /api/auth/register/owner', () => {
        let email;
        let username;
        let password;
        let role;
        let companyName;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/register/owner')
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

            const parsed = cookie.parse(cookies[0]);
            const token = parsed.token;
            expect(token).toBeDefined();
    
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            const requiredKeys = [
                'email', 'username', 'role', 'profile'
            ];
            expect(Object.keys(decoded)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });
});
