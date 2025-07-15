import request from 'supertest';
import mongoose from 'mongoose';
import Restaurant from '../../../models/restaurant.model.js';
import Order from '../../../models/order.model.js';
import Staff from '../../../models/staff.model.js';
import MenuItem from '../../../models/menuItem.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestCustomerProfile } from '../../factories/customerProfile.factory.js';
import { createTestOwnerProfile } from '../../factories/ownerProfile.factory.js';
import { createTestOrder } from '../../factories/order.factory.js';
import { createTestMenuItem } from '../../factories/menuItem.factory.js';
import { createTestStaff } from '../../factories/staff.factory.js';
import { generateAuthToken, staffGenerateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import OwnerProfile from '../../../models/ownerProfile.model.js';
import CustomerProfile from '../../../models/customerProfile.model.js';

describe('order test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/orders', () => {
        let user, profile, token, cookie;
        let order;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
            await profile.save();

            order = createTestOrder({ customer: user.profile });
            await order.save();

            order = createTestOrder({ customer: user.profile });
            await order.save();
        });

        const exec = () => {
            return request(server)
                .get('/api/orders')
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and all orders', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.orders.forEach(order => {    
                const requiredKeys = ['type', 'restaurant', 'customer', 'code', 'items', 'total'];
                expect(Object.keys(order)).toEqual(expect.arrayContaining(requiredKeys));
            });
            expect(res.body.orders.length).toBe(2);
        });
    });

    describe('GET /api/orders/code/:code', () => {
        let user, profile, token, cookie;
        let order, code;
        let restaurant, staff;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});
            await OwnerProfile.deleteMany({});
            await Staff.deleteMany({});

            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user);
            user.profile = profile._id;
            
            restaurant = createTestRestaurant(user.profile);
            staff = await createTestStaff(restaurant._id);
            restaurant.staff = staff._id;
            await staff.save();
            await restaurant.save();
            await profile.save();

            token = staffGenerateAuthToken(staff);
            cookie = setTokenCookie(token);

            order = createTestOrder({ restaurant: restaurant._id });
            await order.save();
            code = order.code;
        });

        const exec = () => {
            return request(server)
                .get(`/api/orders/code/${code}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and the right order', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['type', 'restaurant', 'customer', 'code', 'items', 'total'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body._id).toEqual(String(order._id));
        });
    });

    describe('GET /api/orders/:id', () => {
        let user, profile, token, cookie;
        let order, orderId;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});
            await CustomerProfile.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            order = createTestOrder({ customer: user.profile });
            await order.save();

            orderId = order._id;
        });

        const exec = () => {
            return request(server)
                .get(`/api/orders/${orderId}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and order', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['type', 'restaurant', 'customer', 'code', 'items', 'total'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/orders', () => {
        let user, profile, token, cookie;
        let type, items, item, restaurant;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});
            await OwnerProfile.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            await profile.save();

            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user.profile);
            await restaurant.save();

            item = createTestMenuItem(restaurant);
            await item.save();
            type = 'preorder';
            items = [{
                item: item._id,
                quantity: 1
            }];
        });

        const exec = () => {
            return request(server)
                .post('/api/orders')
                .set('Cookie', [cookie])
                .send({
                    type, items, restaurant: restaurant._id
                });
        };

        it('should return 400 if preorders not enabled', async () => {
            restaurant.preordersEnabled = false;
            await restaurant.save();
            const res = await exec();
            expect(res.status).toBe(400);
        });
        
        it('should return 200 and new order', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['type', 'restaurant', 'customer', 'code', 'items', 'total'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('PATCH /api/orders/:id', () => {
        let user, profile, token, cookie;
        let order, orderId, restaurant;
        let item;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});
            await CustomerProfile.deleteMany({});
            await MenuItem.deleteMany({});

            user = await createTestUser('customer');
            profile = createTestCustomerProfile(user);
            user.profile = profile._id;
            await profile.save();

            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = new mongoose.Types.ObjectId();

            item = createTestMenuItem(restaurant);
            await item.save();

            order = createTestOrder({ customer: user.profile });
            order.items = [{
                item: item._id,
                name: item.name,
                price: item.price,
                quantity: 1
            }];
            await order.save();
            orderId = order._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/orders/${orderId}`)
                .set('Cookie', [cookie])
                .send({
                    update: [{ item: item._id, quantity: 5 }]
                });
        };
        
        it('should return 200 and updated order', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.items[0].quantity).toBe(5);
        });
    });
});