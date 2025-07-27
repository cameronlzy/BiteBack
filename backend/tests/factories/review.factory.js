import mongoose from 'mongoose';
import Review from '../../models/review.model.js';

export function createTestReview(customer = new mongoose.Types.ObjectId(), restaurant = new mongoose.Types.ObjectId()) {
    const rating = 3;
    
    const review = new Review({
        customer: customer._id,
        restaurant,
        rating, dateVisited: new Date(),
    });
    return review;
}

