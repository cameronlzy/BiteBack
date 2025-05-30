const User = require('../models/user.model');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { generateAuthToken } = require('./user.service');
const { validateCustomer } = require('../validators/customerProfile.validator');
const CustomerProfile = require('../models/customerProfile.model');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.getMe = async (userId) => {
    const user = await User.findById(userId)
        .populate('profile')
        .select('-password');
    if (!user) return { status: 400, body: 'User not found.' };
    return { status: 200, body: user };
};

exports.getProfile = async (userId) => {
    // get user
    const user = await User.findById(userId);
    if (!user) return { status: 404, body: 'User not found.' };
    if (user.role != 'customer') return { status: 400, body: 'ID does not belong to a customer.' };

    // get customer profile 
    const profile = await CustomerProfile.findById(user.profile)
        .select('+totalBadges +dateJoined');
    return { status: 200, body: profile };
};

exports.updateMe = async (data, authUser) => {
    if (!['owner', 'customer'].includes(authUser.role)) throw { status: 400, body: 'Invalid role.' };
    data.role = 'customer';

    // validate request change validation for patch
    const { error } = validateCustomer(data);
    if (error) throw { status: 400, body: error.details[0].message };

    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // find user
        const user = await User.findById(authUser._id).session(session || null);
        if (!user) throw { status: 404, body: 'Customer not found.' };

        // check if email or username already taken
        const existingUser = await User.findOne({
            _id: { $ne: authUser._id },
            $or: [
                { email: data.email },
                { username: data.username }
            ]
        }).session(session);
        if (existingUser) {
            if (existingUser.email === data.email) {
                throw { status: 400, body: 'Email is already taken.' };
            }
            if (existingUser.username === data.username) {
                throw { status: 400, body: 'Username is already taken.' };
            }
        }

        // update user
        Object.assign(user, _.pick(data, ['email', 'username']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save({ session });

        // find and update profile
        const profile = await CustomerProfile.findByIdAndUpdate(
          user.profile, 
          { 
            name: data.name, 
            contactNumber: data.contactNumber, 
            favCuisines: data.favCuisines
          },
          { new: true, runValidators: true, session }
        );
        if (!profile) throw { status: 404, body: 'Profile not found.' };

        if (session) await session.commitTransaction();

        // send back user
        const token = generateAuthToken(user);
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = profile;
        return { token, status: 200, body: safeUser };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};