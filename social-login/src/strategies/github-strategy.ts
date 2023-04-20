import { Strategy, Profile } from 'passport-github2';
import { getGithubEmail, getPicture } from '../utils';
import { findLinkedAccount, linkAccount } from '../link-account';
import { Providers } from '../types';

export const githubStrategy = new Strategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback',
    scope: ['user:email'],
    // @ts-ignore: for some reason is string type required
    state: true,
    // @ts-ignore:
    allRawEmails: true,
}, async (_accessToken, _refreshToken, profile: Profile, done) => {
    const email = getGithubEmail(profile.emails as any);
    if (!email) {
        return done(new Error('GitHub account primary email must be verified'));
    }

    const linkedUserId = await findLinkedAccount(Providers.GITHUB, profile.id);
    if (linkedUserId) {
        return done(null, { id: linkedUserId });
    }

    const createdUserId = await linkAccount(Providers.GITHUB, {
        name: profile.displayName,
        email: email,
        picture: getPicture(email, profile.photos),
        subject: profile.id,
    });

    if (!createdUserId) {
        return done(new Error('GitHub account cannot be linked'));
    }

    return done(null, { id: createdUserId });
});
