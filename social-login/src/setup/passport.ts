import passport from 'passport';
import { Express } from 'express';
import { googleStrategy } from '../strategies/google-strategy';
import { githubStrategy } from '../strategies/github-strategy';
import session from 'express-session';
import { guestOnly } from './middlewares';
import { localStrategy } from '../strategies/local-strategy';

export function setupPassport(app: Express) {
    app.use(session({
        name: 'sid',
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, cb) {
        return cb(null, user);
    });

    passport.deserializeUser(function(user: any, cb) {
        return cb(null, user);
    });

    passport.use(localStrategy);
    passport.use(googleStrategy);
    passport.use(githubStrategy);

    app.get('/auth/google', guestOnly, passport.authenticate('google'));
    app.get('/auth/github', guestOnly, passport.authenticate('github'));

    // @ts-ignore
    app.post('/auth/login', guestOnly, passport.authenticate('local', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
        failureFlash: true,
        badRequestMessage: 'Invalid email or password',
    }));

    app.get('/auth/google/callback', guestOnly, passport.authenticate('google', {
        session: true,
        failureRedirect: '/auth/login',
        successRedirect: '/me',
    }));

    app.get('/auth/github/callback', guestOnly, passport.authenticate('github', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
    }));
}
