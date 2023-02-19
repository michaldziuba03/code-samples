import { Strategy } from 'passport-local';
import { userRepository } from '../db';
import argon2 from 'argon2';

const invalidMatch = { message: 'Invalid email or password' };

export const localStrategy = new Strategy({
    usernameField: 'email',
    passReqToCallback: true,
}, async (req, email, password, done) => {
    const user = await userRepository.findOneBy({ email });
    if (!user) {
        return done(null, false, invalidMatch);
    }

    if (!user.password) {
        return done(null, false, invalidMatch);
    }

    const areSame = await argon2.verify(user.password, password);
    if (!areSame) {
        return done(null, false, invalidMatch);
    }

    return done(null, { id: user.id });
});
