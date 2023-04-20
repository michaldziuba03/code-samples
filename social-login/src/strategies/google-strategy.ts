import { Strategy } from 'passport-google-oauth20';
import { findLinkedAccount, linkAccount } from '../link-account';
import { Providers } from '../types';
import { getGoogleEmail, getPicture } from '../utils';

export const googleStrategy = new Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback',
    state: true,
    scope: ['email', 'profile'],
}, async (_accessToken, _refreshToken, profile, done) => {
    const email = getGoogleEmail(profile.emails as any);
    if (!email) {
        return done(new Error('Google account email must be verified'));
    }

    const linkedUserId = await findLinkedAccount(Providers.GOOGLE, profile.id);
    if (linkedUserId) {
        return done(null, { id: linkedUserId });
    }

    const createdUserId = await linkAccount(Providers.GOOGLE, {
        name: profile.displayName,
        email: email,
        picture: getPicture(email, profile.photos),
        subject: profile.id,
    });

    if (!createdUserId) {
        return done(new Error('Google account cannot be linked'));
    }

    return done(null, { id: createdUserId });
});
