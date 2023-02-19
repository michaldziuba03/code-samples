import { config } from 'dotenv';
config();
import express from 'express';
import { setupPassport } from "./passport";
import { authenticatedOnly, guestOnly } from "./middlewares";
import { federatedAccountRepository, userRepository } from "./db";
import { createGravatar } from "./utils";
import argon2 from 'argon2';
import flash from "express-flash";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(flash());
setupPassport(app);

app.get('/me', authenticatedOnly, async (req, res) => {
    const user = await userRepository.findOne({
        where: { id: req.user.id },
        select: ['id', 'picture', 'name'],
    });

    const providers = await federatedAccountRepository.find({
        where: { userId: req.user.id  },
        select: ['provider', 'subject'],
    });

    return res.json({
        ...user,
        providers,
    });
});

app.get('/auth/login', guestOnly, (req, res) => {
    const errors = req.flash('error') || [];
    res.render('login', {
        error: errors[0],
    });
});

app.get('/auth/register', guestOnly, (req, res) => {
    const errors = req.flash('error') || [];
    res.render('register', {
        error: errors[0],
    });
});

app.post('/auth/register', guestOnly, async (req, res) => {
   const { email, name, password } = req.body;
   const exists = await userRepository.exist({ where: { email } });
   console.log(exists, req.body);
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
   });

    return res.redirect('/auth/login');
});

app.get('/logout', authenticatedOnly, (req, res) => {
   req.logout({ keepSessionInfo: false }, () => {});
   return res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server started');
});
