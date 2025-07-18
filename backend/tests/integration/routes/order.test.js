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
import { it } from '@jest/globals';

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

    describe('GET /api/orders/customer/:id', () => {
        let user, profile, token, cookie;
        let order;
        let restaurant, staff;
        let customer;

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

            customer = new mongoose.Types.ObjectId();
            order = createTestOrder({ restaurant: restaurant._id, customer });
            await order.save();
        });

        const exec = () => {
            return request(server)
                .get(`/api/orders/customer/${customer}`)
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

    describe('GET /api/orders/restaurant/:id', () => {
        let user, profile, token, cookie;
        let order, status;
        let restaurant, restaurantId, staff;

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

            order = createTestOrder({ restaurant: restaurant._id });
            order.status = 'preparing';
            await order.save();
            status = 'preparing';
            restaurantId = restaurant._id;
        });

        const exec = () => {
            return request(server)
                .get(`/api/orders/restaurant/${restaurantId}?status=${status}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and orders with the right status', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.forEach(order => {    
                const requiredKeys = ['type', 'restaurant', 'customer', 'code', 'items', 'total'];
                expect(Object.keys(order)).toEqual(expect.arrayContaining(requiredKeys));
                expect(order.status).toEqual(status);
            });
            expect(res.body.length).toBe(1);
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

    describe('PATCH /api/orders/:id/table', () => {
        let user, profile, token, cookie;
        let order, orderId, restaurant, staff;
        let item, tableNumber;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});
            await CustomerProfile.deleteMany({});
            await MenuItem.deleteMany({});

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

            item = createTestMenuItem(restaurant);
            await item.save();

            order = createTestOrder({ restaurant: restaurant._id });
            order.items = [{
                item: item._id,
                name: item.name,
                price: item.price,
                quantity: 1
            }];
            await order.save();
            tableNumber = 3;
            orderId = order._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/orders/${orderId}/table`)
                .set('Cookie', [cookie])
                .send({
                    tableNumber
                });
        };
        
        it('should return 200 and tableNumber', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.tableNumber).toBe(tableNumber);
            const orderInDb = await Order.findById(orderId).select('status').lean();
            expect(orderInDb.status).toBe('preparing');
        });
    });

    describe('PATCH /api/orders/:id/status', () => {
        let user, profile, token, cookie;
        let order, orderId, restaurant, staff;
        let item, status;

        beforeEach(async () => {
            await Order.deleteMany({});
            await Restaurant.deleteMany({});
            await CustomerProfile.deleteMany({});
            await MenuItem.deleteMany({});

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

            item = createTestMenuItem(restaurant);
            await item.save();

            order = createTestOrder({ restaurant: restaurant._id });
            order.items = [{
                item: item._id,
                name: item.name,
                price: item.price,
                quantity: 1
            }];
            await order.save();
            status = 'completed';
            orderId = order._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/orders/${orderId}/status`)
                .set('Cookie', [cookie])
                .send({
                    status
                });
        };
        
        it('should return 200 and updated status', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.status).toBe(status);
            const orderInDb = await Order.findById(orderId).select('status code').lean();
            expect(orderInDb.status).toBe(status);
            expect(orderInDb.code).toBe(undefined);
        });
    });

    describe('PATCH /api/orders/:id', () => {
        let user, profile, token, cookie;
        let order, orderId, restaurant;
        let item, entryId;

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

            entryId = new mongoose.Types.ObjectId();
            order = createTestOrder({ customer: user.profile });
            order.items = [
                {
                    _id: entryId,
                    item: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: 1
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    item: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: 2,
                    remarks: 'less oil'
                }
            ];
            await order.save();
            orderId = order._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/orders/${orderId}`)
                .set('Cookie', [cookie])
                .send({
                    update: [{ _id: entryId, quantity: 5 }]
                });
        };
        
        it('should return 200 and updated order', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.items[0].quantity).toBe(5);
        });

        it('should return 200 and add to order', async () => {
            const res = await request(server)
            .patch(`/api/orders/${orderId}`)
            .set('Cookie', [cookie])
            .send({
                add: [{ item: item._id, quantity: 1, remarks: 'more oil' }]
            });
            expect(res.status).toBe(200);
            expect(res.body.items.length).toBe(3);
        });

        it('should return 200 and remove from order', async () => {
            const res = await request(server)
            .patch(`/api/orders/${orderId}`)
            .set('Cookie', [cookie])
            .send({
                remove: [entryId]
            });
            console.log(res.text);
            expect(res.status).toBe(200);
            expect(res.body.items.length).toBe(1);
        });
    });
});