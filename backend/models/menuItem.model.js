import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    category: { type: String },
    isAvailable: { type: Boolean, default: true }, // owner managed
    isInStock: { type: Boolean, default: true }, // temp, staff managed
}, { timestamps: true, versionKey: false });

menuItemSchema.index({ restaurant: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
