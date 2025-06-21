import Review from '../../models/review.model.js';

export function createTestReview(customer, restaurant) {
    const rating = 3;
    const reviewText = "Great";
    
    const review = new Review({
        customer: customer._id,
        username: customer.username,
        restaurant: restaurant._id,
        rating, reviewText, dateVisited: Date.now()
    });
    return review;
}

