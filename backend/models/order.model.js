import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['preorder'],
        default: 'preorder',
        required: true,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    code: {
        type: String,
        match: /^\d{6}$/,
        required: true,
    },
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, min: 0, required: true },
        quantity: { type: Number, min: 1, required: true },
    }],
    total: { type: Number, min: 0, required: true },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'completed', 'cancelled'],
        default: 'pending',
    },
    tableNumber: { type: Number },
}, { timestamps: true, versionKey: false });

OrderSchema.index({ code: 1, restaurant: 1 }, { unique: true });

export default mongoose.model('Order', OrderSchema);
