import passport from 'passport';
import { Express } from 'express';
import { googleStrategy } from './strategies/google-strategy';
import { githubStrategy } from './strategies/github-strategy';
import session from "express-session";
import {guestOnly} from "./middlewares";
import {localStrategy} from "./strategies/local-strategy";

export function setupPassport(app: Express) {
    app.use(session({
        name: 'sid',
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
            httpOnly: true,
        },
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
            return cb(null, user);
        });
    });

    passport.deserializeUser(function(user: any, cb) {
        process.nextTick(function() {
            return cb(null, user);
        });
    });

    passport.use(localStrategy);
    passport.use(googleStrategy);
    passport.use(githubStrategy);

    app.get('/auth/google', guestOnly, passport.authenticate('google'));
    app.get('/auth/github', guestOnly, passport.authenticate('github'));

    app.post('/auth/login', guestOnly, passport.authenticate('local', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
    }));

    app.get('/auth/google/callback', guestOnly, passport.authenticate('google', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
    }));

    app.get('/auth/github/callback', guestOnly, passport.authenticate('github', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
    }));
}
