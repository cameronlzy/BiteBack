import mongoose from 'mongoose';
import request from 'supertest';
import Promotion from '../../../models/promotion.model.js';
// import path, { dirname } from 'path';
// import { fileURLToPath } from 'url';
import { createTestPromotion } from '../../factories/promotion.factory.js';
import { DateTime } from 'luxon';
import { serverPromise } from '../../../index.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

describe('promotion test', () => {
    let server;

    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/promotions', () => {
        let titles;
        let descriptions;
        let restaurants;
        let promotion;
        let endDates;
        let url;

        beforeEach(async () => {
            await Promotion.deleteMany({});

            // create 2 titles
            titles = ['Alpha', 'Zebra'];

            // create 2 ratings
            descriptions = ['Buy one get one free', 'Half off second purchase'];

            // create 2 restaurant id
            restaurants = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

            // create 2 endDates
            endDates = [
                DateTime.now().plus({ weeks: 1}).toJSDate(), 
                DateTime.now().plus({ weeks: 2 }).toJSDate()
            ];

            // create 2 promotions
            for (let i = 0; i < 2; i++) {
                promotion = createTestPromotion(restaurants[i]);
                promotion.title = titles[i];
                promotion.description = descriptions[i];
                promotion.endDate = endDates[i];
                await promotion.save();
            }
            url = '/api/promotions';
        });

        const exec = () => {
            return request(server)
            .get(url);
        };

        it('should return an array of promotion', async () => {
        const res = await exec();
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.promotions)).toBe(true);
            expect(res.body.promotions.length).toBe(2);

            res.body.promotions.forEach((promotion) => {
                expect(promotion).toHaveProperty('title');
                expect(promotion).toHaveProperty('description');
                expect(promotion).toHaveProperty('startDate');
                expect(promotion).toHaveProperty('endDate');
            });
        });
    
        it('should sort by title ascending', async () => {
            url = '/api/promotions?sortBy=title&order=asc';
            const res = await exec();

            const titlesSorted = [...titles].sort();
            expect(res.body.promotions.map(r => r.title)).toEqual(titlesSorted);
        });

        it('should sort by title descending', async () => {
            url = '/api/promotions?sortBy=title&order=desc';
            const res = await exec();

            const titlesSorted = [...titles].sort().reverse();
            expect(res.body.promotions.map(r => r.title)).toEqual(titlesSorted);
        });

        it('should sort by endDate descending', async () => {
            url = '/api/promotions?sortBy=endDate&order=desc';
            const res = await exec();

            const responseDates = res.body.promotions.map(r => new Date(r.endDate).toISOString());
            const expectedDates = [...endDates].sort((a,b) => b - a).map(d => d.toISOString());

            expect(responseDates).toEqual(expectedDates);
        });

        it('should return only promotions matching search query', async () => {
            url = '/api/promotions?search=Zebra';
            const res = await exec();

            expect(res.body.promotions.length).toBe(1);
            expect(res.body.promotions[0].title).toBe('Zebra');
        });

        it('should return only promotions from restaurant', async () => {
            url = `/api/promotions?restaurants=${restaurants[0].toString()}`;
            const res = await exec();

            expect(res.body.promotions.length).toBe(1);
            expect(res.body.promotions[0].title).toBe('Alpha');
        });
    });
});