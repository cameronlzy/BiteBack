import User from '../models/user.model.js';
import OwnerProfile from '../models/ownerProfile.model.js';
import Reservation from '../models/reservation.model.js';
import Restaurant from '../models/restaurant.model.js';
import * as restaurantService from '../services/restaurant.service.js';
import { generateAuthToken } from '../helpers/token.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';
import _ from 'lodash';
import mongoose from 'mongoose';

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
    if (!user) return { status: 400, body: 'Owner not found.' };
    return { status: 200, body: user };
}

export async function updateMe(update, authUser) {
    return await withTransaction(async (session) => {
        // find user
        const user = await User.findById(authUser._id).populate('profile').session(session);
        if (!user) throw { status: 404, body: 'Owner not found' };
        if (!user.profile) throw { status: 404, body: 'Profile not found' };

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
                    throw { status: 400, body: 'Email is already taken.' };
                }
                if (existingUser.username === update.username) {
                    throw { status: 400, body: 'Username is already taken.' };
                }
            }
        }

        // update user fields selectively
        if (update.email !== undefined) user.email = update.email;
        if (update.username !== undefined) user.username = update.username;
        await user.save(wrapSession(session));

        // selectively update profile fields
        if (update.companyName !== undefined) user.profile.companyName = update.companyName;

        await user.profile.save(wrapSession(session));

        // send back user
        const token = generateAuthToken(user);
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = user.profile.toObject();
        return { token, status: 200, body: safeUser };
    });
}

export async function deleteMe(user) {
    return await withTransaction(async (session) => {
        // find restaurants owned by owner
        const restaurants = await Restaurant.find({ owner: user._id }).session(session);

        // delete each restaurant and its reservations + reviews
        await Promise.all(
            restaurants.map((restaurant) =>
                restaurantService.deleteRestaurantAndAssociations(restaurant, session)
            )
        );

        // delete reservations and profile
        await Promise.all([
            Reservation.deleteMany({ customer: user._id }).session(session),
            OwnerProfile.findByIdAndDelete(user.profile._id).session(session)
        ]);

        // delete user
        await user.deleteOne(wrapSession(session));
        
        return { status: 200, body: user.toObject() };
    });
}