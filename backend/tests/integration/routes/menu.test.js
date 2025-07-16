import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';
import mongoose from 'mongoose';
import MenuItem from '../../../models/menuItem.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import User from '../../../models/user.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestMenuItem } from '../../factories/menuItem.factory.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('menu item test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/menu/restaurant/:id', () => {
        let menuItem;
        let restaurant, restaurantId;
        let user, token, cookie;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();
            restaurantId = restaurant._id;
            menuItem = createTestMenuItem(restaurantId);
            await menuItem.save();
            menuItem = createTestMenuItem(restaurantId);
            menuItem.isAvailable = false;
            await menuItem.save();
        });

        const exec = () => {
            return request(server)
                .get(`/api/menu/restaurant/${restaurantId}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and all menu items for owner', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.forEach(item => {    
                const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable', 'isInStock'];
                expect(Object.keys(item)).toEqual(expect.arrayContaining(requiredKeys));
            });
            expect(res.body.length).toBe(2);
        });

        it('should return 200 and menu items for non-owner', async () => {
            const res = await request(server)
                .get(`/api/menu/restaurant/${restaurantId}`);
            expect(res.status).toBe(200);
            res.body.forEach(item => {    
                const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable', 'isInStock'];
                expect(Object.keys(item)).toEqual(expect.arrayContaining(requiredKeys));
                expect(item.isAvailable).toEqual(true);
            });
            expect(res.body.length).toBe(1);
        });
    });

    describe('GET /api/menu/:id', () => {
        let menuItem, menuItemId;

        beforeEach(async () => {
            await MenuItem.deleteMany({});

            menuItem = createTestMenuItem();
            await menuItem.save();
            menuItemId = menuItem._id;
        });

        const exec = () => {
            return request(server)
                .get(`/api/menu/${menuItemId}`);
        };
        
        it('should return 200 and menu item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/menu', () => {
        let user, token, cookie;
        let restaurant, menuItem;
        let name, category, description, price;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            menuItem = createTestMenuItem(restaurant._id);
            name = menuItem.name;
            category = menuItem.category;
            description = menuItem.description;
            price = menuItem.price;
        });

        const exec = () => {
            return request(server)
                .post('/api/menu')
                .set('Cookie', [cookie])
                .send({
                    name, category, description, price, restaurant: restaurant._id
                });
        };
        
        it('should return 200 and new menu item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/menu/:id/images', () => {
        let user, token, cookie;
        let menuItem, menuItemId;
        let filePath;
        let restaurant;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await User.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            // create event
            menuItem = createTestMenuItem(restaurant._id);
            await menuItem.save();
            menuItemId = menuItem._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .post(`/api/menu/${menuItemId}/image`)
            .set('Cookie', [cookie])
            .attach('image', filePath)
        };

        it('should return 403 if menuItem does not belong to owner', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await request(server)
                .post(`/api/menu/${menuItemId}/image`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(403);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);

            expect(typeof res.body.image).toBe('string');

            const urlRegex = /^https?:\/\/.+|^\/.+/;
            expect(res.body.image).toMatch(urlRegex);
        });
    });

    describe('PATCH /api/menu/:id/image', () => {
        let user, token, cookie;
        let menuItem, menuItemId;
        let filePath;
        let restaurant;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await User.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            // create event
            menuItem = createTestMenuItem(restaurant._id);
            await menuItem.save();
            menuItemId = menuItem._id

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .patch(`/api/menu/${menuItemId}/image`)
            .set('Cookie', [cookie])
            .attach('image', filePath)
        };

        it('should return 400 if no images attached', async () => {
            const res = await request(server)
                .patch(`/api/menu/${menuItemId}/image`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(400);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('image');

            expect(typeof res.body.image).toBe('string');

            const urlRegex = /^https?:\/\/.+|^\/.+/;
            expect(res.body.image).toMatch(urlRegex);
        });
    });

    describe('PATCH /api/menu/:id/in-stock', () => {
        let menuItem, menuItemId, isInStock;
        let restaurant;
        let staff, token, cookie;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            restaurant = createTestRestaurant();
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            await restaurant.save();
            await staff.save();

            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            menuItem = createTestMenuItem(restaurant._id);
            await menuItem.save();
            menuItemId = menuItem._id;
            isInStock = false;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/menu/${menuItemId}/in-stock`)
                .set('Cookie', [cookie])
                .send({ isInStock });
        };
        
        it('should return 200 and menu item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const itemInDb = await MenuItem.findById(menuItemId).select('isInStock').lean();
            expect(itemInDb.isInStock).toEqual(isInStock);
        });
    });

    describe('PATCH /api/menu/:id', () => {
        let menuItem, menuItemId;
        let restaurant;
        let user, token, cookie;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            menuItem = createTestMenuItem(restaurant._id);
            await menuItem.save();
            menuItemId = menuItem._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/menu/${menuItemId}`)
                .set('Cookie', [cookie])
                .send({ price: 10 });
        };
        
        it('should return 200 and menu item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.price).toBe(10);
        });
    });

    describe('DELETE /api/menu/:id', () => {
        let menuItem, menuItemId;
        let restaurant;
        let user, token, cookie;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            menuItem = createTestMenuItem(restaurant._id);
            await menuItem.save();
            menuItemId = menuItem._id;
        });

        const exec = () => {
            return request(server)
                .delete(`/api/menu/${menuItemId}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and delete reward item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            const itemInDb = await MenuItem.findById(res.body._id).lean();
            expect(itemInDb).toBeNull();
        });
    });
});