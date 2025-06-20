import User from '../models/user.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import Review from '../models/review.model.js';
import Reservation from '../models/reservation.model.js';
import * as reviewService from '../services/review.service.js';
import { generateAuthToken } from '../helpers/token.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';

export async function getMe(userId) {
    const user = await User.findById(userId)
        .populate('profile')
        .select('-password')
        .lean();
    if (!user) return { status: 400, body: 'User not found.' };
    return { status: 200, body: user };
}

export async function publicProfile(customerId) {
    // get customer
    const customer = await CustomerProfile.findById(customerId)
        .select('+totalBadges +dateJoined +username')
        .lean();
    if (!customer) return { status: 404, body: 'Customer not found.' };

    return { status: 200, body: customer };
}

export async function updateMe(update, authUser) {
    return await withTransaction(async (session) => {
        // find user
        const user = await User.findById(authUser._id).populate('profile').session(session);
        if (!user) throw { status: 404, body: 'Customer not found' };
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
        if (update.name !== undefined) user.profile.name = update.name;
        if (update.contactNumber !== undefined) user.profile.contactNumber = update.contactNumber;
        if (update.favCuisines !== undefined) user.profile.favCuisines = update.favCuisines;

        await user.profile.save(wrapSession(session));

        // update reviews
        if (update.username !== undefined) {
            await Review.updateMany(
                { customer: user.profile._id },
                { $set: { username: update.username }}
            ).session(session);
        }

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
            Reservation.deleteMany({ customer: user._id }).session(session),
            CustomerProfile.findByIdAndDelete(user.profile).session(session)
        ]);

        // delete user
        await user.deleteOne(wrapSession(session));
        
        return { status: 200, body: user.toObject() };
    });
}