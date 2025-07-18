import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email'
    }
  },
  username: { type: String, minlength: 2, unique: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['customer', 'owner'], required: true },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'profileModel',
  },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  verifyEmailToken: { type: String },
  verifyEmailExpires: { type: Date },
}, { versionKey: false });

userSchema.virtual('profileModel').get(function () {
  return this.role === 'customer' ? 'CustomerProfile' : 'OwnerProfile';
});

const User = mongoose.model('User', userSchema);

export default User; 