import 'reflect-metadata';
import { config } from 'dotenv';
config();
import express from 'express';
import { setupPassport } from './setup/passport';
import { authenticatedOnly, guestOnly } from './setup/middlewares';
import { startDatabase, userRepository } from './setup/db';
import { createGravatar } from './utils';
import argon2 from 'argon2';
import flash from 'express-flash';

startDatabase();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(flash());
setupPassport(app);

app.get('/', (req, res) => {
    res.redirect('/me');
});

app.get('/me', authenticatedOnly, async (req, res) => {
    const user = await userRepository.findOne({
        where: { id: req.user!.id },
        select: ['id', 'picture', 'name', 'accounts'],
        relations: { accounts: true },
    });

    return res.render('me', { user });
});

app.get('/auth/login', guestOnly, (req, res) => {
    const errors = req.flash('error') || [];
    res.render('login', { error: errors[0] });
});

app.get('/auth/register', guestOnly, (req, res) => {
    const errors = req.flash('error') || [];
    res.render('register', { error: errors[0] });
});

app.post('/auth/register', guestOnly, async (req, res) => {
   const { email, name, password } = req.body;
   const exists = await userRepository.exist({ where: { email } });
   if (exists) {
       req.flash('error', ['User already exists']);
       return res.redirect('/auth/register');
   }

   const hashedPassword = await argon2.hash(password);
   await userRepository.save({
       email,
       name,
       password: hashedPassword,
       picture: createGravatar(email),
       /*
        IMPORTANT: we register users as always verified because we haven't email-verification mechanism.
        You should always register users with isVerified: false by default, and change it to "true" in email-verification route.
        Email verification mechanism is out of scope of this guide.
       */
       isVerified: true
   });

    req.flash('success', 'Now you can login to created account');
    return res.redirect('/auth/login');
});

app.get('/logout', authenticatedOnly, (req, res) => {
   req.logout({ keepSessionInfo: false }, () => {});
   return res.redirect('/auth/login');
});

app.listen(3000, () => {
    console.log('Server started');
});
