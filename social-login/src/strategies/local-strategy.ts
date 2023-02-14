import { Strategy } from 'passport-local';
import {userRepository} from "../db";
import argon2 from "argon2";

export const localStrategy = new Strategy({
    usernameField: 'email',
}, async (email, password, done) => {
    const user = await userRepository.findOneBy({ email });
    if (!user) {
        return done(new Error('Invalid email or password'), false);
    }

    if (!user.password) {
        return done(new Error('Invalid email or password'), false);
    }

    const areSame = await argon2.verify(user.password, password);
    if (!areSame) {
        return done(new Error('Invalid email or password'), false);
    }

    return done(null, user);
});
