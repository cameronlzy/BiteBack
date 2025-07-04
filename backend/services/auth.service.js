import User from '../models/user.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import OwnerProfile from '../models/ownerProfile.model.js';
import Staff from '../models/staff.model.js';
import { generateAuthToken, staffGenerateAuthToken } from '../helpers/token.helper.js';
import { wrapSession, withTransaction } from '../helpers/transaction.helper.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import crypto from 'crypto';
import config from 'config';
import sendEmail from '../helpers/sendEmail.js';
import { error, success } from '../helpers/response.js';

export async function forgotPassword(credentials) {
    // find user
    const user = await User.findOne(credentials.email 
        ? { email: credentials.email }
        : { username: credentials.username }
    );

    if (!user) return error(400, 'User with this email/username does not exist');
    
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = hash;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetLink = `${config.get('frontendLink')}/reset-password/${token}`;
    await sendEmail(user.email, 'Password Reset', `Click to reset your password: ${resetLink}`);

    return success({ message: 'Password reset link sent to your email' });
}

export async function resetPassword(data, token)  {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const user = await User.findOne({
        resetPasswordToken: hash,
        resetPasswordExpires: { $gt: now },
    });

    if (!user) return error(400, 'Token is invalid or expired');

    const { password } = data;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return success({ message: 'Password has been reset' });
}

export async function changePassword(data, authUser) {
    // find user and verify credentials
    const { status, body } = await verifyUserCredentials({
        username: authUser.username, 
        password: data.oldPassword
    });
    if (status !== 200) return { status, body };
    const user = body;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(data.password, salt);

    await user.save();
    const token = generateAuthToken(user);
    return { token, status: 200, body: _.pick(user, ['_id', 'email', 'username', 'role'])};
}

export async function login(credentials) {
    // find user and verify credentials
    const { status, body } = await verifyUserCredentials(credentials);
    if (status !== 200) return { status, body };
    const token = generateAuthToken(body);
    return { token, status: 200, body: _.pick(body, ['_id', 'email', 'username', 'role']) };
}

export async function registerCustomer(data) {
    return await withTransaction(async (session) => {
        // if user exists
        let existingUser = await User.findOne({
          $or: [
                { email: data.email },
                { username: data.username }
          ]
        }).session(session).lean();
        if (existingUser) {
            if (existingUser.email === data.email && existingUser.role === 'owner') {
                return error(400, 'Email already registered to a restaurant owner');
            }
            if (existingUser.email === data.email && existingUser.role === 'customer') {
                return error(400, 'Email already registered to a customer');
            }
            if (existingUser.username === data.username) {
                return error(400, 'Username already taken.');
            }
        }

        // create a customer profile
        let customerProfile = new CustomerProfile(_.pick(data, ['name', 'contactNumber', 'favCuisines', 'username']));

        // create new user
        let user = new User(_.pick(data, ['email', 'username', 'password', 'role']));
        customerProfile.user = user._id;
        await customerProfile.save(wrapSession(session));

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'CustomerProfile';
        user.profile = customerProfile._id;
        await user.save(wrapSession(session));

        const token = generateAuthToken(user);
        return { token, status: 200, body: _.pick(user, ['_id', 'email', 'username', 'role']) };
    });
}

export async function registerOwner(data) {
    return await withTransaction(async (session) => {
        // if user exists
        let existingUser = await User.findOne({
            $or: [
                { email: data.email },
                { username: data.username }
            ]
        }).session(session).lean();
        if (existingUser) {
            if (existingUser.email === data.email && existingUser.role === 'owner') {
                return error(400, 'Email already registered to a restaurant owner');
            }
            if (existingUser.email === data.email && existingUser.role === 'customer') {
                return error(400, 'Email already registered to a customer');
            }
            if (existingUser.username === data.username) {
                return error(400, 'Username already taken');
            }
        }

        // create new user
        let user = new User(_.pick(data, ['email', 'username', 'password', 'role']));

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'OwnerProfile';
        user.profile = new mongoose.Types.ObjectId();

        // create a owner profile
        let ownerProfile = new OwnerProfile(_.pick(data, ['companyName', 'username']));
        ownerProfile.user = user._id;
        await ownerProfile.save(wrapSession(session));

        // reupdate user.profile
        user.profile = ownerProfile._id;
        await user.save(wrapSession(session));

        const token = generateAuthToken(user);
        const safeUser = _.pick(user, ['_id', 'email', 'username', 'role']);
        return { token, status: 200, body: safeUser };
    });
}

export async function staffLogin(credentials) {
    const staff = await Staff.findOne({ username: credentials.username });
    if (!staff) return error(400, 'Invalid username or password');

    const isValid = await bcrypt.compare(credentials.password, staff.password);
    if (!isValid) return error(400, 'Invalid username or password');

    const token = staffGenerateAuthToken(staff);
    return { token, status: 200, body: _.pick(staff, ['_id', 'username', 'role', 'restaurant']) };
}

// utility services
export async function verifyUserCredentials(credentials, session = undefined) {
    const user = await User.findOne(credentials.email
        ? { email: credentials.email }
        : { username: credentials.username }
    ).session(session);

    if (!user) return error(400, 'Invalid email, username or password');

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) return error(400, 'Invalid email, username or password');

    return success(user);
}