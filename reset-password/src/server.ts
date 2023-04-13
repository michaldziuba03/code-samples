import 'reflect-metadata';
import { config } from 'dotenv';
config();
import express from 'express';
import session from 'express-session';
import flash from 'express-flash';
import { resetTokenRepository, sampleDataSource, startDatabase, userRepository } from './setup/db';
import { randomBytes, createHash } from 'crypto';
import argon2 from 'argon2';
import { User } from './entities/User';
import { ResetToken } from './entities/ResetToken';
import { MoreThanOrEqual } from 'typeorm';
import { sendResetEmail } from './mail';
import { throttleResetPassword } from './throttler';

startDatabase();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(session({
    name: 'sid',
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false,
}));

app.get('/', (req, res) => {
    return res.redirect('/login');
});

app.get('/reset/request', (req, res) => {
    return res.render('reset-request');
});

const TWENTY_MINUTES = 20 * 60 * 1000;
app.post('/reset/request', async (req, res) => {
    const { email } = req.body;
    
    const isBlocked = await throttleResetPassword(email);
    if (isBlocked) {
        req.flash('err', 'Too many reset password requests');
        return res.redirect('/reset/request');
    }

    const user = await userRepository.findOneBy({ email });
    if (user) {
        const token = randomBytes(64).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');

        await resetTokenRepository.save({
            token: tokenHash,
            userId: user.id,
            tokenExpiry: Date.now() + TWENTY_MINUTES,
        });

        sendResetEmail(user.email, token);
    }

    // show successful message even if user doesn't exist
    return res.render('sent', { email });
});

app.get('/reset/:token', (req, res) => {
    return res.render('reset', {
        token: req.params.token,
    });
});

app.post('/reset', async (req, res) => {
    const { token, password } = req.body;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await resetTokenRepository.findOneBy({ 
        token: tokenHash,
        tokenExpiry: MoreThanOrEqual(Date.now()),
     });

    if (!resetToken) {
        return res.render('error');
    }

    const hashedPassword = await argon2.hash(password);
    
    await sampleDataSource.transaction(async t => {
        await t.update(
            User, 
            { id: resetToken.userId }, 
            { password: hashedPassword },
        );

        await t.delete(ResetToken, { userId: resetToken.userId });
    })

    return res.render('success');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { email, name, password } = req.body;

    const userExists = await userRepository.exist({ where: {
        email,
    } });

    if (userExists) {
        req.flash('err', 'User already exists');
        return res.redirect('/register');
    }

    const hashedPassword = await argon2.hash(password);

    const user = await userRepository.save({
        email,
        name,
        password: hashedPassword,
    });

    req.flash('success', 'Now you can login to created account');
    return res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await userRepository.findOneBy({ email });
    if(!user) {
        req.flash('err', 'Invalid email or password');
        return res.redirect('/login');
    }


    const isMatching = await argon2.verify(user.password, password);
    if (!isMatching) {
        req.flash('err', 'Invalid email or password');
        return res.redirect('/login');
    }

    req.flash('success', 'Valid email and password :)');
    return res.redirect('/login');
});


app.listen(3000, () => {
    console.log('Server started');
});
