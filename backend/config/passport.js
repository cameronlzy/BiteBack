import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from 'config';
import User from '../models/user.model.js';

passport.use(new GoogleStrategy({
    clientID: config.get('google.clientId'),
    clientSecret: config.get('google.clientSecret'),
    callbackURL: '/api/auth/google/callback',
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const role = req.query.state;
        let user = await User.findOne({ email });
        const isNewUser = !user;

        if (isNewUser) {
            user = await User.create({ email, role });
        }

        user._isNew = isNewUser;
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));
