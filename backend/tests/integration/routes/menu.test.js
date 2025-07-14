import MenuItem from '../../../models/menuItem.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestMenuItem } from '../../factories/menuItem.factory.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import request from 'supertest';
import mongoose from 'mongoose';
import Restaurant from '../../../models/restaurant.model.js';
import User from '../../../models/user.model.js';

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
        let restaurantId;

        beforeEach(async () => {
            await MenuItem.deleteMany({});
            await Restaurant.deleteMany({});

            restaurantId = new mongoose.Types.ObjectId();
            menuItem = createTestMenuItem(restaurantId);
            await menuItem.save();
            menuItem = createTestMenuItem(restaurantId);
            await menuItem.save();
        });

        const exec = () => {
            return request(server)
                .get(`/api/menu/restaurant/${restaurantId}`);
        };
        
        it('should return 200 and all menu items', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.items.forEach(item => {    
                const requiredKeys = ['restaurant', 'name', 'description', 'price', 'category', 'isAvailable'];
                expect(Object.keys(item)).toEqual(expect.arrayContaining(requiredKeys));
            });
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