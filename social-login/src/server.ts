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

/* 
  Use this endpoint to see how Passport.js handles state parameter with OAuth2 and express-session.
  In real app you shouldn't expose endpoint like this.    
*/
app.get('/session', (req, res) => {
    res.json(req.session);
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
        Email verification mechanism is out of scope of this guide, but it's important part of secure app.
        
        You should require email verification to even finish the registration process (to make Classic-Federated Merge Attack harder).
        You should revoke all active user's sessions after successful password reset (to prevent Unexpired Session Identifier Attack).

        Reference: https://msrc.microsoft.com/blog/2022/05/pre-hijacking-attacks/
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
