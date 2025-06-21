import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerProfile',
        required: true
    },
    username: { type: String, minlength: 2, required: true },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    rating: {
        type: Number, 
        required: true,
        min: 0, 
        max: 5
    },
    reviewText: {
        type: String,
        maxlength: 1000,
        default: ''
    },
    dateVisited: {
        type: Date, required: true
    },
    reply: {
        type: {
            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'OwnerProfile',
                required: true
            },
            replyText: {
                type: String,
                required: true,
                maxlength: 1000
            },
            createdAt: {
                type: Date, 
                default: Date.now
            }
        },
        default: undefined
    },
    isVisible: {
        type: Boolean,
        required: true,
        default: false
    },
    images: {
        type: [String],
        default: [],
    },
}, {
    timestamps: { createdAt: true, updatedAt: false }, 
    versionKey: false
});

reviewSchema.path('createdAt').immutable(true);
reviewSchema.index({ restaurant: 1 });
reviewSchema.index({ customer: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;