import mongoose from 'mongoose';

const customerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, minlength: 2, required: true },
  username: { type: String, minlength: 2, required: true },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid 8-digit contact number!`
    }
  },
  emailOptOut: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'dateJoined', updatedAt: false }, 
  versionKey: false
});

customerProfileSchema.path('dateJoined').immutable(true);

const CustomerProfile = mongoose.model('CustomerProfile', customerProfileSchema);

export default CustomerProfile;
