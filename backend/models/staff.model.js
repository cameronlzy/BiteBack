import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, 
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        unique: true
    },
    role: { type: String, default: 'staff' }
}, { versionKey: false });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;