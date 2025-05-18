const { User } = require('../../models/user');
const { CustomerProfile } = require('../../models/customerProfile');
const { OwnerProfile } = require('../../models/ownerProfile');
const request = require('supertest');
const { default: mongoose } = require('mongoose');
const { Restaurant } = require('../../models/restaurant');

describe('register test', () => {
    let server;
    beforeAll(() => {
        server = require('../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('customer registration', () => {
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
        });

        it('should return create a customer profile', async () => {
            const res = await exec();
            const user = await User.findOne({ email: email })
                .populate('profile');
            expect(user.profile).toHaveProperty('name');
            expect(user.profile).toHaveProperty('contactNumber');
            expect(user.profile).toHaveProperty('favCuisines'); 
            expect(user.profile).toHaveProperty('points');
        });
    });

    describe('owner registration', () => {
        let email;
        let username;
        let password;
        let role;

        let companyName;
        let restaurant;
        let restaurantName;
        let address;
        let contactNumber;
        let cuisines;
        let openingHours;
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
                        email: restaurantEmail,
                        website
                    }
                ]
            });
        };
    
        beforeEach(async () => { 
            await User.deleteMany({});
            await CustomerProfile.deleteMany({});
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
            restaurantEmail = `restaurant@gmail.com`;
            website = "https://www.restaurant.com";

            restaurant = new Restaurant({
                name: restaurantName,
                address,
                contactNumber,
                cuisines,
                openingHours,
                email: restaurantEmail,
                website
            });
            await restaurant.save();

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
        });

        it('should return create a owner profile', async () => {
            const res = await exec();
            const user = await User.findOne({ email: email })
                .populate('profile');
            expect(user.profile).toHaveProperty('companyName');
            expect(user.profile).toHaveProperty('restaurants');
        });
    });
});