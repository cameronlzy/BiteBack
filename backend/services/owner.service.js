import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import _ from 'lodash';
import config from 'config';
import User from '../models/user.model.js';
import OwnerProfile from '../models/ownerProfile.model.js';
import Restaurant from '../models/restaurant.model.js';
import Staff from '../models/staff.model.js';
import * as restaurantService from '../services/restaurant.service.js';
import { generateAuthToken } from '../helpers/token.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';
import simpleCrypto from '../helpers/encryption.helper.js';
import { error, success } from '../helpers/response.js';
import { sendVerifyEmail } from '../helpers/sendEmail.js';

export async function getMe(userId) {
    const user = await User.findById(userId)
        .populate({
            path: 'profile', 
            populate: {
                path: 'restaurants',
                model: 'Restaurant'
            }
        })
        .select('-password').lean();
    if (!user) return error(400, 'Owner not found');
    return success(user);
}

export async function createProfile(tempUser, data) {
    return await withTransaction(async (session) => {
        const user = await User.findById(tempUser._id).session(session);
        if (!user) return error(404, 'User not found');

        const profile = new OwnerProfile(_.pick(data, ['companyName', 'username']));
        profile.user = user._id;
        await profile.save(wrapSession(session));
        
        user.profile = profile._id;
        user.username = data.username;
        await user.save(wrapSession(session));

        if (user.isVerified) {
            const token = generateAuthToken(user);
            return { token, status: 200, body: profile.toObject() };
        } else {
            // send email
            const token = crypto.randomBytes(32).toString('hex');
            const hash = crypto.createHash('sha256').update(token).digest('hex');

            user.verifyEmailToken = hash;
            user.verifyEmailExpires = Date.now() + 30 * 60 * 1000;
            await user.save(wrapSession(session));

            const link = `${config.get('frontendLink')}/verify-email/${token}`;
            await sendVerifyEmail(user.email, user.username, link);
            return success(profile.toObject());
        }
    });
}

export async function getStaffWithStepUp(authUser, password) {
    // find user
    const user = await User.findById(authUser._id).populate('profile').lean();
    if (!user) return error(400, 'Owner not found');

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return error(400, 'Invalid password');
    }

    // find restaurants
    const restaurants = await Restaurant.find({
        _id: { $in: user.profile.restaurants }
    }).lean();
    
    const result = await Promise.all(
        restaurants.map(async (restaurant) => {
            const staff = await Staff.findOne({ restaurant: restaurant._id }).lean();
            return {
                restaurant: {
                    _id: restaurant._id,
                    name: restaurant.name
                },
                staff: staff ? {
                    _id: staff._id,
                    username: staff.username,
                    password: simpleCrypto.decrypt(staff.encryptedPassword)
                } : null
            };
        })
    );

    return success(result);
}

export async function updateMe(update, authUser) {
    return await withTransaction(async (session) => {
        // find user
        const user = await User.findById(authUser._id).populate('profile').session(session);
        if (!user) return error(404, 'Owner not found');
        if (!user.profile) return error(404, 'Profile not found');

        // check if email or username being updated and is already taken
        const uniqueCheck = [];
        if (update.email !== undefined) uniqueCheck.push({ email: update.email });
        if (update.username !== undefined) uniqueCheck.push({ username: update.username });

        if (uniqueCheck.length) {
            const existingUser = await User.findOne({
                _id: { $ne: authUser._id },
                $or: uniqueCheck,
            }).session(session).lean();

            if (existingUser) {
                if (existingUser.email === update.email) {
                    return error(400, 'Email is already taken');
                }
                if (existingUser.username === update.username) {
                    return error(400, 'Username is already taken');
                }
            }
        }

        // update user fields selectively
        if (update.email !== undefined) user.email = update.email;
        if (update.username !== undefined) user.username = update.username;
        await user.save(wrapSession(session));

        // selectively update profile fields
        if (update.username !== undefined) user.profile.username = update.username;
        if (update.companyName !== undefined) user.profile.companyName = update.companyName;

        await user.profile.save(wrapSession(session));

        // send back user
        const token = generateAuthToken(user);
        const { password: _password, ...safeUser } = user.toObject();
        safeUser.profile = user.profile.toObject();
        return { token, status: 200, body: safeUser };
    });
}

export async function deleteMe(user) {
    return await withTransaction(async (session) => {
        // find restaurants owned by owner
        const restaurants = await Restaurant.find({ owner: user.profile }).session(session);

        // delete each restaurant and its reservations + reviews
        await Promise.all(
            restaurants.map((restaurant) =>
                restaurantService.deleteRestaurantAndAssociations(restaurant, session)
            )
        );

        // delete profile
        await OwnerProfile.findByIdAndDelete(user.profile._id).session(session);

        // delete user
        await user.deleteOne(wrapSession(session));
        
        return success(user.toObject());
    });
}