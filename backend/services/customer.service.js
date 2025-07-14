import User from '../models/user.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import Review from '../models/review.model.js';
import Reservation from '../models/reservation.model.js';
import * as reviewService from '../services/review.service.js';
import { generateAuthToken } from '../helpers/token.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';
import { error, success } from '../helpers/response.js';

export async function getMe(userId) {
    const user = await User.findById(userId)
        .populate('profile')
        .select('-password')
        .lean();
    if (!user) return error(400, 'User not found');
    return success(user);
}

export async function publicProfile(customerId) {
    // get customer
    const customer = await CustomerProfile.findById(customerId)
        .select('+totalBadges +dateJoined +username')
        .lean();
    if (!customer) return error(404, 'Customer not found');

    return success(customer);
}

export async function updateMe(update, authUser) {
    return await withTransaction(async (session) => {
        // find user
        const user = await User.findById(authUser._id).populate('profile').session(session);
        if (!user) return error(404, 'Customer not found');
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
        if (update.name !== undefined) user.profile.name = update.name;
        if (update.contactNumber !== undefined) user.profile.contactNumber = update.contactNumber;
        if (update.favCuisines !== undefined) user.profile.favCuisines = update.favCuisines;

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
        // find reviews by customer
        const reviews = await Review.find({ customer: user.profile }).session(session);

        // delete each review
        await Promise.all(
            reviews.map((review) =>
                reviewService.deleteReviewAndAssociations(review, session)
            )
        );

        // delete reservations and profile
        await Promise.all([
            Reservation.deleteMany({ customer: user.profile }).session(session),
            CustomerProfile.findByIdAndDelete(user.profile).session(session)
        ]);

        // delete user
        await user.deleteOne(wrapSession(session));
        
        return success(user.toObject());
    });
}