import mongoose from 'mongoose';
import VisitHistory from '../../../models/visitHistory.model.js';
import { addVisitToHistory } from '../../../services/visitHistory.service.js';
import { serverPromise } from '../../../index.js';

describe('visit history service test', () => {
    let server;

    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('addVisitToHistory test', () => {
        let customer, restaurant, date;

        beforeEach(async () => {
            await VisitHistory.deleteMany({});
            customer = new mongoose.Types.ObjectId();
            restaurant = new mongoose.Types.ObjectId();
            date = new Date();
        });

        it('should create a new VisitHistory document with a visit', async () => {
            await addVisitToHistory(customer, restaurant, date);

            const doc = await VisitHistory.findOne({ customer, restaurant });
            expect(doc).not.toBeNull();
            expect(doc.visits).toHaveLength(1);
            expect(doc.visits[0].visitDate.getTime()).toBe(Math.floor(date.getTime() / 1000) * 1000);
            expect(doc.visits[0].reviewed).toBe(false);
        });

        it('should not add a duplicate visit with the same timestamp (rounded to second)', async () => {
            const nearDuplicate = new Date(date.getTime() + 10);

            await addVisitToHistory(customer, restaurant, date);
            await addVisitToHistory(customer, restaurant, nearDuplicate);

            const doc = await VisitHistory.findOne({ customer, restaurant });
            expect(doc.visits).toHaveLength(1);
        });

        it('should add a second visit if timestamps differ by at least 1 second', async () => {
            const otherDate = new Date(date.getTime() + 1001);

            await addVisitToHistory(customer, restaurant, date);
            await addVisitToHistory(customer, restaurant, otherDate);

            const doc = await VisitHistory.findOne({ customer, restaurant });
            expect(doc.visits).toHaveLength(2);
            const timestamps = doc.visits.map(v => v.visitDate.getTime());
            expect(timestamps).toContain(Math.floor(date.getTime() / 1000) * 1000);
            expect(timestamps).toContain(Math.floor(otherDate.getTime() / 1000) * 1000);
        });
    });
});