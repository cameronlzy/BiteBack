const request = require('supertest');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User, createTestUser } = require('../../models/user');
const { CustomerProfile } = require('../../models/customerProfile');
const { OwnerProfile } = require('../../models/ownerProfile');
const { Restaurant, createTestRestaurant } = require('../../models/restaurant');
const config = require('config');

describe.skip('auth test', () => {
    let server;
    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/auth/me', () => {
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

        beforeEach(async () => {
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

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
            let owner = await createTestUser('owner');

            // creating restaurant
            let restaurant = createTestRestaurant(owner._id);
            await restaurant.save();

            // creating an ownerProfile
            let companyName = "name";
            let ownerProfile = await OwnerProfile({
                user: owner._id,
                companyName, 
                restaurants: [restaurant._id]
            });
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();
            token = owner.generateAuthToken();

            const res = await exec();
            expect(res.status).toBe(200);
        });
    });

    describe('PUT /api/auth/me - customer', () => {
        let token;
        let email;
        let username;
        let password = 'myPassword@123';
        let name;
        let contactNumber;
        let favCuisines;
        let user;
        let profile;
        let newContactNumber;

        beforeEach(async () => {
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});

            // creates user with password: myPassword@123
            user = await createTestUser('customer');
            email = user.email;
            username = user.username;

            // create customer profile
            name = "test";
            contactNumber = "87654321";
            favCuisines = ['Chinese'];
            profile = new CustomerProfile({
                user: user._id,
                name, contactNumber, username, favCuisines
            });
            await profile.save();

            user.profile = profile._id;
            await user.save();
            token = user.generateAuthToken();

            // update the customer
            newContactNumber = "12345678";
        });

        const exec = () => {
            return request(server)
                .put('/api/auth/me')
                .set('x-auth-token', token)
                .send({
                    email, username, password, name, 
                    contactNumber: newContactNumber, favCuisines
                });
        };

        it('should return 401 if no token', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            token = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid request', async () => {
            token = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

         it('should return 404 if user not found', async () => {
            let otherUser = await createTestUser('customer');
            token = otherUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if username already taken', async () => {
            let otherUser = await createTestUser('customer');
            await otherUser.save();
            username = otherUser.username;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if profile not found', async () => {
            user.profile = new mongoose.Types.ObjectId();
            await user.save();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated user + profile', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('role');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('name');
            expect(res.body.profile).toHaveProperty('contactNumber');
        });
    });

    describe('PUT /api/auth/me - owner', () => {
        let token;
        let email;
        let username;
        let password = 'myPassword@123';
        let companyName;
        let user;
        let profile;
        let newCompanyName;
        let restaurant;

        beforeEach(async () => {
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // creates user with password: myPassword@123
            user = await createTestUser('owner');
            email = user.email;
            username = user.username;

            // create restaurant
            restaurant = createTestRestaurant(user._id);
            await restaurant.save();

            // create owner profile
            companyName = "company";
            profile = new OwnerProfile({
                user: user._id,
                companyName,
                restaurants: [restaurant._id]
            });
            await profile.save();

            user.profile = profile._id;
            await user.save();
            token = user.generateAuthToken();

            // update the customer
            newCompanyName = "new name";
        });

        const exec = () => {
            return request(server)
                .put('/api/auth/me')
                .set('x-auth-token', token)
                .send({
                    email, username, password, companyName: newCompanyName
                });
        };

        it('should return 401 if no token', async () => {
            token = "";
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid token', async () => {
            token = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid request', async () => {
            token = "1";
            const res = await exec();
            expect(res.status).toBe(400);
        });

         it('should return 404 if user not found', async () => {
            let otherUser = await createTestUser('owner');
            token = otherUser.generateAuthToken();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 400 if username already taken', async () => {
            let otherUser = await createTestUser('owner');
            await otherUser.save();
            username = otherUser.username;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if profile not found', async () => {
            user.profile = new mongoose.Types.ObjectId();
            await user.save();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated user + profile', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('username');
            expect(res.body).toHaveProperty('role');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body.profile).toHaveProperty('companyName');
            expect(res.body.profile).toHaveProperty('restaurants');
        });
    });

    describe('POST /api/auth/register - customer', () => {
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
    
        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });
    
        it('should return username, email, role', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['_id', 'email', 'username', 'role']));
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return create a customer profile', async () => {
            const res = await exec();
            const user = await User.findOne({ email: email })
                .populate('profile');
            expect(user.profile).toHaveProperty('name');
            expect(user.profile).toHaveProperty('contactNumber');
            expect(user.profile).toHaveProperty('favCuisines'); 
            expect(user.profile).toHaveProperty('points');
            expect(user.profile).toHaveProperty('dateJoined');
        });
    });

    describe('POST /api/auth/register - owner', () => {
        let email;
        let username;
        let password;
        let role;

        let companyName;
        let restaurantName;
        let address;
        let contactNumber;
        let cuisines;
        let openingHours;
        let maxCapacity;
        let restaurantEmail;
        let website;
    
        const exec = () => {
            return request(server)
            .post('/api/auth/register')
            .send({
                email, username, password, role, companyName,
                restaurants: [
                    {
                        name: restaurantName,
                        address,
                        contactNumber,
                        cuisines,
                        openingHours,
                        maxCapacity,
                        email: restaurantEmail,
                        website
                    }
                ]
            });
        };
    
        beforeEach(async () => { 
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // creating a restaurant
            restaurantName = "restaurant";
            address = "new york";
            contactNumber = "87654321";
            cuisines = ["Chinese"];
            openingHours = {
                monday: "09:00-17:00",
                tuesday: "09:00-17:00",
                wednesday: "09:00-17:00",
                thursday: "09:00-17:00",
                friday: "09:00-17:00",
                saturday: "10:00-14:00",
                sunday: "Closed"
            };
            maxCapacity = 50;
            restaurantEmail = `restaurant@gmail.com`;
            website = "https://www.restaurant.com";

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
    
        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });
    
        it('should return username, email, role', async () => {
            const res = await exec();
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['_id', 'email', 'username', 'role']));
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return create a owner profile', async () => {
            const res = await exec();
            const user = await User.findOne({ email: email })
                .populate('profile');
            expect(user.profile).toHaveProperty('companyName');
            expect(user.profile).toHaveProperty('restaurants');
            expect(user.profile).toHaveProperty('dateJoined');
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
            expect(res.body).not.toHaveProperty('password');
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
});
