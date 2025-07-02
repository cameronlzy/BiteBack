import mongoose from 'mongoose';
import VisitHistory from '../../models/visitHistory.model';

export function createTestVisitHistory(restaurant = new mongoose.Types.ObjectId(), customer = new mongoose.Types.ObjectId()) {
    const visits = [{
        visitDate: Date.now(),
        reviewed: false,
    }];

    const visitHistory = new VisitHistory({
        restaurant, customer, visits
    });
    return visitHistory;
}