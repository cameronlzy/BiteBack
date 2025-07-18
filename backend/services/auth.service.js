import User from '../models/user.model.js';
import Staff from '../models/staff.model.js';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import crypto from 'crypto';
import config from 'config';
import { generateAuthToken, staffGenerateAuthToken, generateTempToken } from '../helpers/token.helper.js';
import { sendResetPasswordEmail, sendVerifyEmail } from '../helpers/sendEmail.js';
import { error, success } from '../helpers/response.js';

export async function register(data) {
    // if user exists
    let existingUser = await User.findOne({
        $or: [
            { email: data.email },
            { username: data.username }
        ]
    }).lean();
    if (existingUser) {
        if (existingUser.email === data.email) {
            return error(400, 'Email already registered');
        }
        if (existingUser.username === data.username) {
            return error(400, 'Username already taken.');
        }
    }

    // create new user
    let user = new User(_.pick(data, ['email', 'username', 'role']));

    // hash password and add references
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(data.password, salt);
    await user.save();
    
    const token = generateTempToken(user);
    return { token, status: 200, body: _.pick(user, ['_id', 'email', 'username', 'role']) };
}

export async function verifyEmail(token) {
    if (!token) return error(400, 'Token is required');

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        verifyEmailToken: hash,
        verifyEmailExpires: { $gt: Date.now() },
    });

    if (!user) return error(400, 'Token is invalid or expired');

    user.isVerified = true;
    user.verifyEmailToken = undefined;
    user.verifyEmailExpires = undefined;
    await user.save();

    return success({ message: 'Email verified successfully' });
}

export async function resendVerification(data) {
    const user = await User.findOne({ email: data.email });
    if (!user) return error(400, 'User not found');

    if (user.isVerified) return error(400, 'Email is already verified');

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    user.verifyEmailToken = hash;
    user.verifyEmailExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const link = `${config.get('frontendLink')}/verify-email/${token}`;
    await sendVerifyEmail(user.email, user.username, link);

    return success({ message: 'Verification email resent' });
}

export async function setPassword(tempUser, data) {
    const user = await User.findById(tempUser._id);
    if (!user) return error(404, 'User not found');
    if (user.password) return error(400, 'Password already set');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(data.password, salt);
    await user.save();

    return success({ message: 'Password set successfully' });
}

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
    await sendResetPasswordEmail(user.email, user.baseModelName, resetLink);

    return success({ message: 'Password reset link sent to your email' });
}

export async function resetPassword(data, token) {
    if (!token) return error(400, 'Token is required');

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
    return success(_.pick(user, ['_id', 'email', 'username', 'role']));
}

export async function login(credentials) {
    // find user and verify credentials
    const { status, body } = await verifyUserCredentials(credentials);
    if (status !== 200) return { status, body };
    const token = generateAuthToken(body);
    return { token, status: 200, body: _.pick(body, ['_id', 'email', 'username', 'role']) };
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