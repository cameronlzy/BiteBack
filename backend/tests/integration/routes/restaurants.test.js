const Reservation = require('../../../models/reservation.model');
const User = require('../../../models/user.model');
const Restaurant = require('../../../models/restaurant.model');
const OwnerProfile = require('../../../models/ownerProfile.model');
const { createTestUser } = require('../../factories/user.factory');
const { createTestRestaurant } = require('../../factories/restaurant.factory');
const { createTestOwnerProfile } = require('../../factories/ownerProfile.factory');
const { generateAuthToken } = require('../../../services/user.service');
const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const { DateTime } = require('luxon');
const setTokenCookie = require('../../../helpers/setTokenCookie');

describe('restaurant test', () => {
    let server;

    beforeAll(() => {
        server = require('../../../index');
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/restaurants', () => {
        let restaurant;
        let names;
        let counts;
        let ratings;
        let cuisines;
        let url;

        beforeEach(async () => {
            await Restaurant.deleteMany({});

            // create 2 names
            names = ['Alpha', 'Zebra'];

            // create 2 ratings
            ratings = [4.5, 2.0];

            // create 2 reviewCounts
            counts = [10, 100];

            // create 2 cuisines
            cuisines = [
                ['Chinese'], ['Western']
            ];

            // create 2 restaurants
            for (let i = 0; i < 2; i++) {
                restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
                restaurant.averageRating = ratings[i];
                restaurant.reviewCount = counts[i];
                restaurant.name = names[i];
                restaurant.cuisines = cuisines[i];
                await restaurant.save();
            }
            url = '/api/restaurants';
        });

        const exec = () => {
            return request(server)
            .get(url);
        };

        it('should return an array of restaurants', async () => {
        const res = await exec();
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.restaurants)).toBe(true);
            expect(res.body.restaurants.length).toBe(2);

            res.body.restaurants.forEach((restaurant) => {
                expect(restaurant).toHaveProperty('name');
                expect(restaurant).toHaveProperty('cuisines');
                expect(restaurant).toHaveProperty('averageRating');
                expect(restaurant).toHaveProperty('reviewCount');
                expect(restaurant).toHaveProperty('tags');
                expect(restaurant).toHaveProperty('address');
                expect(restaurant).toHaveProperty('images');
            });
        });
    
        it('should sort by name ascending', async () => {
            url = '/api/restaurants?sortBy=name&order=asc';
            const res = await exec();

            const namesSorted = [...names].sort();
            expect(res.body.restaurants.map(r => r.name)).toEqual(namesSorted);
        });

        it('should sort by name descending', async () => {
            url = '/api/restaurants?sortBy=name&order=desc';
            const res = await exec();

            const namesSorted = [...names].sort().reverse();
            expect(res.body.restaurants.map(r => r.name)).toEqual(namesSorted);
        });

        it('should sort by averageRating descending', async () => {
            url = '/api/restaurants?sortBy=averageRating&order=desc';
            const res = await exec();

            const sorted = [...ratings].sort((a, b) => b - a);
            expect(res.body.restaurants.map(r => r.averageRating)).toEqual(sorted);
        });

        it('should sort by reviewCount ascending', async () => {
            url = '/api/restaurants?sortBy=reviewCount&order=asc';
            const res = await exec();

            const sorted = [...counts].sort((a, b) => a - b);
            expect(res.body.restaurants.map(r => r.reviewCount)).toEqual(sorted);
        });

        it('should return only restaurants matching search query', async () => {
            url = '/api/restaurants?search=Zebra';
            const res = await exec();

            expect(res.body.restaurants.length).toBe(1);
            expect(res.body.restaurants[0].name).toBe('Zebra');
        });
    });

    describe('GET /api/restaurants/discover', () => {
        let url;
        let locations;
        let cuisines;
        let openingHours;
        let ratings;
        let restaurant;
        const queryLat = 1.45069144403824;
        const queryLng = 103.79996778334721;
        const nearCoords = [103.79996778334721, 1.45069144403824]; // currentLocation
        const midCoords = [103.77055853873995, 1.4778911115333417]; // ~4.5 km 
        const farCoords = [103.85, 1.29];                          // ~18 km 
        
        beforeEach(async () => {
            await Restaurant.deleteMany({});

            // create 4 locations
            locations = [
                {
                    type: 'Point', 
                    coordinates: nearCoords,
                },
                {
                    type: 'Point', 
                    coordinates: nearCoords,
                },
                {
                    type: 'Point', 
                    coordinates: midCoords,
                },
                {
                    type: 'Point', 
                    coordinates: farCoords,
                },
            ];

            // create 4 cuisines
            cuisines = [
                ['Chinese'],
                ['Japanese'],
                ['Chinese'],
                ['Chinese'],
            ];

            // create 4 openingHours
            openingHours = [
                '00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59',
                '00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59',
                '00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59|00:00-23:59',
                'x|x|x|x|x|x|x',
            ];

            // create 4 ratings
            ratings = [4.5, 5.0, 1.5, 3.5];

            // create 4 restaurants
            for (let step = 0; step < 4; step++) {
                restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
                restaurant.location = locations[step];
                restaurant.cuisines = cuisines[step];
                restaurant.averageRating = ratings[step];
                restaurant.openingHours = openingHours[step];
                await restaurant.save();
            }
        });

        const exec = () => {
            return request(server)
            .get(url);
        };

        it('should return only restaurants with Chinese cuisine and rating >= 2', async () => {
            url = `/api/restaurants/discover?cuisines=Chinese&minRating=2`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2); // Chinese + valid rating (rest 1 + 4)
            res.body.forEach(r => {
                expect(r.cuisines).toContain('Chinese');
                expect(r.averageRating).toBeGreaterThanOrEqual(2);
            });
        });

        it('should return only restaurants currently open', async () => {
            url = `/api/restaurants/discover?cuisines=Chinese&minRating=2&openNow=true`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1); // Only restaurant 1
            expect(res.body[0].cuisines).toContain('Chinese');
        });

        it('should include closed restaurants when openNow=false', async () => {
            url = `/api/restaurants/discover?cuisines=Chinese&minRating=2&openNow=false`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2); // Restaurant 1 + 4
        });

        it('should return 0 if no restaurants match the rating filter', async () => {
            url = `/api/restaurants/discover?cuisines=Chinese&minRating=5`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(0);
        });

        it('should support multiple cuisines in query', async () => {
            url = `/api/restaurants/discover?cuisines=Chinese,Japanese&minRating=2`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3); // Rest 1, 2, 4
        });

        it('should return only restaurants within 100m radius', async () => {
            const radius = 100;
            url = `/api/restaurants/discover?cuisines=Chinese&minRating=2&lat=${queryLat}&lng=${queryLng}&radius=${radius}&openNow=true`;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].location.coordinates).toEqual(nearCoords);
        });

        it('should return restaurants within 5km radius', async () => {
            const radius = 5000;
            url = `/api/restaurants/discover?cuisines=Chinese&lat=${queryLat}&lng=${queryLng}&radius=${radius}`;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            const resultCoords = res.body.map(r => r.location.coordinates);
            expect(resultCoords).toEqual(
                expect.arrayContaining([nearCoords, midCoords])
            );
        });

        it('should return all restaurants within a very large radius', async () => {
            const radius = 20000;
            url = `/api/restaurants/discover?cuisines=Chinese&lat=${queryLat}&lng=${queryLng}&radius=${radius}`;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
        });
    });

    describe('GET /api/restaurants/:id', () => {
        let restaurant;
        let restaurantId;

        beforeEach(async () => {
            await Restaurant.deleteMany({});

            // create restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;
        });

        const exec = () => {
            return request(server)
            .get(`/api/restaurants/${restaurantId}`);
        };

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return a restaurant object', async () => {
            const res = await exec();
            const requiredKeys = [
                'name', 'address', 'contactNumber', 'cuisines', 'openingHours', 'maxCapacity'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('GET /api/restaurants/:id/availability', () => {
        let user;
        let userId;
        let restaurant;
        let restaurantId;
        let reservationDate;
        let queryDateSG;
        let pax;
        let url;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await Reservation.deleteMany({});

            // create a user
            user = await createTestUser('customer');
            await user.save();
            userId = user._id;

            // create a restaurant
            restaurant = createTestRestaurant(new mongoose.Types.ObjectId());
            await restaurant.save();
            restaurantId = restaurant._id;

            // create a reservation
            reservationDate = new Date('2025-05-17T11:00'); // UTC date
            queryDateSG = DateTime.fromJSDate(reservationDate, { zone: 'utc' }).setZone('Asia/Singapore').toISODate(); // SG date
            pax = 10;
            const reservation = new Reservation({
                user: userId, restaurant: restaurantId,
                reservationDate, pax
            });
            await reservation.save();

            // create url
            url = `/api/restaurants/${restaurantId}/availability?date=${queryDateSG}`;
        });

        const exec = () => {
            return request(server)
            .get(url);
        };

        it('should return 400 if invalid id', async () => {
            url = `/api/restaurants/1/availability?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if no date query', async () => {
            url = `/api/restaurants/${restaurantId}/availability`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid date', async () => {
            url = `/api/restaurants/${restaurantId}/availability?date=1`;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if no restaurant found', async () => {
            url = `/api/restaurants/${user._id}/availability?date=${queryDateSG}`;
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid token, restaurant closed', async () => {
            const sunday = DateTime.fromISO('2025-05-18').setZone('Asia/Singapore').toISODate();
            url = `/api/restaurants/${restaurantId}/availability?date=${sunday}`;
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toBe(-1);
        });

        it('should return 200 if valid token, restaurant not closed', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return an array of availability', async () => {
            const res = await exec();
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(slot => {
                expect(slot).toHaveProperty('time');
                expect(typeof slot.time).toBe('string');
                expect(slot.time).toMatch(/^\d{2}:\d{2}$/);

                expect(slot).toHaveProperty('available');
                expect(typeof slot.available).toBe('number');
                expect(slot.available).toBeGreaterThanOrEqual(0);
            });
        });
    });

    // skip to avoid sending requests to mapBox
    describe.skip('POST /api/restaurants', () => {
        let name;
        let address;
        let contactNumber;
        let cuisines;
        let tags;
        let openingHours;
        let maxCapacity;

        let owner;
        let ownerProfile;

        let email;
        let username;
        let password;
        let role;
        let token;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create an owner
            email = "myOwner@gmail.com";
            username = "myOwner";
            password = "myPassword@123";
            role = "owner";
            owner = await User({
                email, username, password, role, profile: new mongoose.Types.ObjectId(), roleProfile: "OwnerProfile"
            });
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // creating an ownerProfile
            ownerProfile = createTestOwnerProfile(owner);
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();

            // creating a restaurant
            name = "restaurant";
            address = "Blk 30 Kelantan Lane #12-01D, S208652";
            contactNumber = "87654321";
            cuisines = ["Chinese"];
            openingHours = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
            maxCapacity = 50;
            tags = ["Live Music"];
        });

        const exec = () => {
            return request(server)
            .post('/api/restaurants')
            .set('Cookie', [cookie])
            .send({
                name, address, contactNumber, cuisines,
                openingHours, maxCapacity, tags
            });
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if user does not exist', async () => {
            await User.deleteMany({});
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return a restaurant object', async () => {
            const res = await exec();
            const requiredKeys = [
                'name', 'address', 'contactNumber', 'cuisines', 'openingHours', 'maxCapacity', 'location', 'tags'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    // skip to avoid sending requests to mapBox
    describe.skip('POST /api/restaurants/bulk', () => {
        let restaurantName1, address1, contactNumber1, cuisines1, maxCapacity1, restaurantEmail1, website1;
        let restaurantName2, address2, contactNumber2, cuisines2, maxCapacity2;
        let cookie;
        let token;
        let user;
        let profile;
        let tags;

        beforeEach(async () => { 
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Restaurant.deleteMany({});

            // creating restaurant 1
            restaurantName1 = "restaurant1";
            address1 = "Blk 30 Kelantan Lane #12-01D, S208652";
            contactNumber1 = "87654321";
            cuisines1 = ["Chinese"];
            openingHours1 = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
            maxCapacity1 = 50;
            restaurantEmail1 = `restaurant@gmail.com`;
            website1 = "https://www.restaurant.com";
            tags = ["Live Music"];

            // creating restaurant 2
            restaurantName2 = "restaurant2";
            address2 = "Blk 48 Dakota Crescent, S390048";
            contactNumber2 = "12345678";
            cuisines2 = ["Japanese"];
            openingHours2 = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
            maxCapacity2 = 30;

            // creating a owner
            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user);
            await profile.save();
            user.profile = profile._id;
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
        });

        const exec = () => {
            return request(server)
            .post('/api/restaurants/bulk')
            .set('Cookie', [cookie])
            .send({
                restaurants: [
                    {
                        name: restaurantName1,
                        address: address1,
                        contactNumber: contactNumber1,
                        cuisines: cuisines1,
                        openingHours: openingHours1,
                        maxCapacity: maxCapacity1,
                        email: restaurantEmail1,
                        website: website1, tags
                    },
                    {
                        name: restaurantName2,
                        address: address2,
                        contactNumber: contactNumber2,
                        cuisines: cuisines2,
                        openingHours: openingHours2,
                        maxCapacity: maxCapacity2, tags
                    }
                ]
            });
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 404 if user does not exist', async () => {
            await User.deleteMany({});
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 200 and array of restaurantID if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.every(id => typeof id === 'string')).toBe(true);
        });
    });

    // skip to avoid sending test images to cloudinary
    describe.skip('POST /api/restaurants/:id/images', () => {
        let owner;
        let ownerProfile;
        let restaurant;
        let restaurantId;
        let token;
        let cookie;
        let filePath;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create an owner
            owner = await createTestUser('owner');
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // creating an ownerProfile
            ownerProfile = createTestOwnerProfile(owner);
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();

            // creating a restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .post(`/api/restaurants/${restaurantId}/images`)
            .set('Cookie', [cookie])
            .attach('images', filePath);
        };

        it.skip('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('images');
            expect(Array.isArray(res.body.images)).toBe(true);

            const allStrings = res.body.images.every(url => typeof url === 'string');
            expect(allStrings).toBe(true);
        });
    });

    describe('PUT /api/restaurants/:id/images', () => {
        let restaurant;
        let token;
        let cookie;
        let imagesPayload;

        beforeEach(async () => {
            // create restaurant + user
            const user = await createTestUser('owner');
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user._id);
            restaurant.images = [
                'https://res.cloudinary.com/drmcljacy/image/upload/v1749107618/biteback/restaurants/icpacpiowpwwvsvieec8.jpg', // image 1 (to be deleted)
                'https://res.cloudinary.com/drmcljacy/image/upload/v1749118205/biteback/restaurants/uxtab5rmjomf57ouznni.jpg', // image 2
                'https://res.cloudinary.com/drmcljacy/image/upload/v1749107560/biteback/restaurants/aqm6h7qc3iei3gvjzala.png', // image 3 (to be next thumbnail)
            ];

            imagesPayload = [
                'https://res.cloudinary.com/drmcljacy/image/upload/v1749107560/biteback/restaurants/aqm6h7qc3iei3gvjzala.png',
                'https://res.cloudinary.com/drmcljacy/image/upload/v1749118205/biteback/restaurants/uxtab5rmjomf57ouznni.jpg',
            ];
            await restaurant.save();
        });

        const exec = () => {
            return request(server)
            .put(`/api/restaurants/${restaurant._id}/images`)
            .set('Cookie', [cookie])
            .send({ images: imagesPayload });
        };

        it('should return 400 if images is missing', async () => {
            const res = await request(server)
            .put(`/api/restaurants/${restaurant._id}/images`)
            .set('Cookie', [cookie])
            .send({});
            expect(res.status).toBe(400);
        });

        it('should return 400 if images is not an array', async () => {
            imagesPayload = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if any item is not a valid URL', async () => {
            imagesPayload = ['not-a-url']
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it.skip('should return 200 for valid array of image URLs', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.images.length).toBe(2);
            expect(res.body.images[0]).toBe('https://res.cloudinary.com/drmcljacy/image/upload/v1749107560/biteback/restaurants/aqm6h7qc3iei3gvjzala.png');
        });
    });

    describe('PATCH /api/restaurants/:id', () => {
        let restaurant;
        let restaurantId;
        let token;
        let name;
        let contactNumber;
        let cuisines;
        let openingHours;
        let maxCapacity;
        let owner;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            
            // create an owner
            owner = await createTestUser('owner');
            await owner.save();
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            // updated details
            name = "restaurant";
            contactNumber = "87654321";
            cuisines = ["Chinese"];
            openingHours = "09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|09:00-17:00|10:00-14:00|x";
            maxCapacity = 50;
        });

        const exec = () => {
            return request(server)
            .patch(`/api/restaurants/${restaurantId}`)
            .set('Cookie', [cookie])
            .send({
                name, contactNumber, cuisines,
                openingHours, maxCapacity
            });
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid id', async () => {
            restaurantId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid request', async () => {
            cuisines = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if restaurant does not belong to user', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated restaurant', async () => {
            const res = await exec();
            const requiredKeys = [
                'name', 'address', 'contactNumber', 'cuisines', 'openingHours', 'maxCapacity'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('DELETE /api/restaurants/:id', () => {
        let restaurant;
        let restaurantId;
        let token;
        let owner;
        let email;
        let username;
        let password;
        let role;
        let ownerProfile;
        let cookie;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            // create an owner
            email = "myOwner@gmail.com";
            username = "myOwner";
            password = "myPassword@123";
            role = "owner";
            owner = await User({
                email, username, password, role, profile: new mongoose.Types.ObjectId(), roleProfile: "OwnerProfile"
            });
            token = generateAuthToken(owner);
            cookie = setTokenCookie(token);

            // creating a restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();

            // creating an ownerProfile
            ownerProfile = createTestOwnerProfile(owner);
            await ownerProfile.save();

            owner.profile = ownerProfile._id;
            await owner.save();

            // create restaurant
            restaurant = createTestRestaurant(owner._id);
            await restaurant.save();
            restaurantId = restaurant._id;
        });

        const exec = () => {
            return request(server)
            .delete(`/api/restaurants/${restaurantId}`)
            .set('Cookie', [cookie]);
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid id', async () => {
            restaurantId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 404 if user does not exist', async () => {
            await User.deleteMany({});
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 404 if restaurant not found', async () => {
            restaurantId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return 403 if restaurant does not belong to user', async () => {
            let otherOwner = await createTestUser('owner');

            let otherOwnerProfile = createTestOwnerProfile(otherOwner);
            await otherOwnerProfile.save();
            otherOwner.profile = otherOwnerProfile._id;
            await otherOwner.save();

            token = generateAuthToken(otherOwner);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 200 if valid request', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return updated restaurant', async () => {
            const res = await exec();
            const requiredKeys = [
                'name', 'address', 'contactNumber', 'cuisines', 'openingHours', 'maxCapacity'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });
});