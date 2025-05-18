const { User } = require('../../models/user');
const request = require('supertest');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const { CustomerProfile } = require('../../models/customerProfile');
const { OwnerProfile } = require('../../models/ownerProfile');
const { Restaurant } = require('../../models/restaurant');

describe('login test', () => {
    let server;
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

    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

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

    it('should return 400 if empty request', async () => {
        email = "";
        username = "";
        password = "";
        const res = await emailLogin();
        expect(res.status).toBe(400);
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

    it('should return 200 when logging in through username for owner', async () => {
        role = "owner";
        roleProfile = "OwnerProfile";
        username = "myOwner";
        email = "myOwner@gmail.com";
        user = new User({
            email, username, password: hashedPassword, role, roleProfile,
            profile: new mongoose.Types.ObjectId(),
        });
        await user.save();
        const res = await usernameLogin();
        expect(res.status).toBe(200);
    });

    it('should return username, email, role', async () => {
        const res = await usernameLogin();
        expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['_id', 'email', 'username', 'role']));
    });

    it('should return valid jwtToken', async () => {
        const res = await usernameLogin();
        const token = res.headers['x-auth-token'];
        expect(token).toBeDefined();

        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        
        expect(decoded).toHaveProperty('email');
        expect(decoded).toHaveProperty('username');
        expect(decoded).toHaveProperty('role');
    });
});