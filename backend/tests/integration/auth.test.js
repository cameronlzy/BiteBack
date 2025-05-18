const { User } = require('../../models/user');
const request = require('supertest');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
let server;

describe('auth', () => {
    let email;
    let username;
    let password;
    let role;
    let roleProfile;
    let token;
    let user;

    const exec = () => {
        return request(server)
            .get('/api/auth/me')
            .set('x-auth-token', token);
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

        email = "myEmail@gmail.com";
        username = "username";
        password = "myPassword@123";
        role = "customer";
        roleProfile = "CustomerProfile";

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email,
            username,
            password: hashedPassword,
            role,
            roleProfile,
            profile: new mongoose.Types.ObjectId(),
        });

        await user.save();
        token = user.generateAuthToken();
    });

    it('should return 401 if no token', async () => {
        token = "";
        const res = await exec();
        expect(res.status).toBe(401);
    });

    it('should return 400 if invalid token', async () => {
        token = "invalid-token";
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if valid token for customer', async () => {
        const res = await exec();
        expect(res.status).toBe(200);
    });

    it('should return user details', async () => {
        const res = await exec();
        expect(Object.keys(res.body)).toEqual(expect.arrayContaining([
            'email', 'username', 'role', 'profile'
        ]));
    });

    it('should return 200 if valid token for owner', async () => {
        await User.deleteMany({});
        role = "owner";
        roleProfile = "OwnerProfile";

        user = new User({
            email,
            username,
            password: await bcrypt.hash(password, 10),
            role,
            roleProfile,
            profile: new mongoose.Types.ObjectId(),
        });

        await user.save();
        token = user.generateAuthToken();

        const res = await exec();
        expect(res.status).toBe(200);
    });
});
