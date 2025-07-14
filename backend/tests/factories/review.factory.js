import mongoose from 'mongoose';
import Review from '../../models/review.model.js';

export function createTestReview(customer = { _id: new mongoose.Types.ObjectId(), username: 'username' }, restaurant = new mongoose.Types.ObjectId()) {
    const rating = 3;
    
    const review = new Review({
        customer: customer._id,
        username: customer.username,
        restaurant,
        rating, dateVisited: new Date(),
    });
    return review;
}

