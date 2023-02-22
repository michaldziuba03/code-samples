<p align="center">
  <img width="700" alth="thumbnail" src="https://user-images.githubusercontent.com/43048524/218723224-cbb72ea8-bd6c-4117-a011-67ceb8ed753b.png" />
</p>

<h1 align="center"> Social login in Node.js </h1>
<p align="center"> 
  Node.js • TypeScript • Passport.js • Google • GitHub • Express.js
</p>


## Setup and run
Clone repository:
```
git clone git@github.com:michaldziuba03/samples.git
cd samples/social-login
```

Install dependencies with npm:
```
npm install
```

Create `.env` file and replace sample values with your own credentials:
```env
GOOGLE_CLIENT_ID='xxxxxxxx.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='xxxxxxxx'

GITHUB_CLIENT_ID='xxxx'
GITHUB_CLIENT_SECRET='xxxxxxxx'

SESSION_SECRET='secret'
```

Now you can run application:
```
npm run dev
```

## Screenshots
> GET /auth/register
<img alt="screenshot" width="700px" src="https://user-images.githubusercontent.com/43048524/219996750-a7d7e813-bd20-40c7-be60-55c348133cd8.png" />

> GET /auth/login
<img alt="screenshot" width="700px" src="https://user-images.githubusercontent.com/43048524/219996868-73e7f59e-9122-44bf-b33a-07e507842f9a.png" />


> GET /me
<img alt="screenshot" width="700px" src="https://user-images.githubusercontent.com/43048524/219996962-31a471bd-18ac-470c-86e0-cf7367107eed.png" />


# Article

<details>
  <summary><h3>Table of Contents</h3></summary>
  <ol>
    <li>
      <a href="#intro">Intro</a>
    </li>
    <li>
      <a href="#passportjs">Passport.js</a>
      <ul>
        <li><a href="#strategies-graveyard">Strategies graveyard</a></li>
        <li><a href="#typescript-problems">TypeScript problems</a></li>
      </ul>
    </li>
    <li>
      <a href="#oauth-20-standard">OAuth 2.0 standard</a>
      <ul><li><a href="#oauth-20-authorization-code-flow-example">OAuth 2.0 Authorization Code Flow example</a></li></ul>
    </li>
    <li>
      <a href="#social-login-implementation-overview">Social login implementation overview</a>
      <ul>
        <li><a href="#some-universal-rules-and-common-gotchas">Some universal rules and common gotchas</a></li>
        <li><a href="#first-method---user-can-login-with-only-one-provider">First method</a></li>
        <li><a href="#second-method---user-can-login-with-multiple-providers">Second method</a></li>
        <li><a href="#third-method---user-can-login-with-multiple-providers-but-needs-to-verify-email-if-account-already-exists">Third method</a></li>
      </ul>
    </li>
    <li>
      <a href="#code-sample">Code Sample</a>
      <ul>
        <li><a href="#database-setup">Database setup</a></li>
      </ul>
    </li>
  </ol>
</details>

## Intro
I have seen many tutorials and articles about social login in Node.js, and most of them don't cover the actual integration with the database. This article is not a typical tutorial. I just want to discuss the tricky parts of social authentication, possible database schemas and common mistakes I have observed in other people's codes. If you are facing a similar problem, I hope you will find this text helpful.

> This article DOESN'T pretend to show you best practices - this text is based on my own opinions and thoughts.

## Passport.js
Let's talk about the most popular auth middleware for Node.js - PassportJS. I found using this library in a modern TypeScript stack to be a pain for me. PassportJS just feels a little bit outdated.

### Strategies graveyard
What scares me the most in PassportJS? The development activity. According to the official website, Passport.js contains over 500 strategies and some of them, even **official** strategies like `passport-github` are just [kinda broken](https://github.com/jaredhanson/passport-github/issues/75). For that reason I use `passport-github2` in the code sample.


<p align="center">
  <img width="670" src="https://user-images.githubusercontent.com/43048524/218758014-3d8ebc5b-a758-4417-bfe1-ccb5b4878795.png" />
</p>

### TypeScript problems
Some types are just incorrect. Here is an example: `profile.emails[0].verified` is actually BOOLEAN, but is typed as string literal.

<img width="600" src="https://user-images.githubusercontent.com/43048524/218768285-762e287a-18b9-476f-a700-2214d49813ba.png" />

I found that option exists by reading a source code of strategy...

<img width="600" src="https://user-images.githubusercontent.com/43048524/218771617-8e1a6dcd-a0db-4524-ba3c-87c0dee80be5.png" />


## OAuth 2.0 standard
We cannot discuss social authentication without mentioning the OAuth 2.0 standard. This standard is the basis of most Passport.js strategies, so I think it's important to understand at least the data flow. Most Passport.js strategies use `Authorization Code Flow`, because this flow is suited for a regular server applications.

### OAuth 2.0 Authorization Code Flow example
1. User clicks `Continue with GitHub` button.
2. Button redirects user to GitHub authorization page.
3. On GitHub authorization page, user must first log in to the service. Then they will be prompted by the service to authorize or deny the application access to their account.
4. After successful authorization, GitHub redirects user back to our application (to callback endpoint) and sends `code` in query params.
5. Our application exchange `code` value for access token by sending **code**, **client id** and **client secret** to GitHub servers.
6. Our application sends an authorized request (with obtained access token) to the GitHub API and retrieves the profile of the authorized user.
7. Now we can use that profile data to login or register new account in our system.

### Some additional resources about OAuth 2.0
- https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2
- https://auth0.com/intro-to-iam/what-is-oauth-2
- https://auth0.com/docs/get-started/authentication-and-authorization-flow/which-oauth-2-0-flow-should-i-use
- https://oauth.net/2/oauth-best-practice/

## Social login implementation overview
Now let's get to the right part of article. We will be talking about the moment when you get the user's profile in the Passport.js strategy callback. During my little research, I have observed at least 3 ways to implement social authentication.

### Some universal rules and common gotchas
Before we will discuss each social auth implementation method, I want to mention a few universal rules that apply to any method:

1. Email address is not reliable for existing account lookup - use social account's id instead. In my implementations I use emails only for linking new social provider to existing account OR creating new account. Why email address from social provider is not reliable? Because in some providers you can **CHANGE** email address and in some implementations I have seen, you will end up with new account in that case :)

2. Email address from social provider must be verified. It's very important if you want to link new social provider to existing account. Why? Because some bad actor can find out that a particular email is registered in your application and create a new Google (as example) account with that email address. Bad actor can use that unverified Google account to get access to legitimate account from your application.

3. Some providers may not return the email address. In some providers user can register with a phone number. You can simply deny social accounts without email or save phone number (if returned) in email column/field.

### First method - user can login with ONLY one provider
The first method is fairly simple. User can use only one authentication method for specific email. That means you cannot link your Google account if you registered with email and password method previously.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/219104514-2b36ebce-b303-4026-b858-1119d5f62919.png)
> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### MongoDB
For MongoDB schema is the same:
```json
{
  "_id": <ObjectId>,
  "name": "John Doe",
  "email": "johndoe@gmail.com",
  "password": null,
  "provider": "github",
  "providerId": "42580000"
}
```

#### Example flow
I will briefly explain this method, because I want to focus actually on second method.
1. Find user by provider and social account id (providerId)
2. If user already exists - create session/JWT
3. If user doesn't exists - create new user with data from social provider (email, social account id, displayName). Make sure email is not already taken.

#### Pros:
- easiest to implement

#### Cons:
- bad user experience - most people expects your application to link their social accounts connected to the same email address

### Second method - user can login with multiple providers
The second method is the most common implementation but is also more complex. User can link multiple authentication providers (connected to the same email address) to a single account.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/219093100-36628861-ea9f-4dc7-bf49-862a1a4275fd.png)
> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### MongoDB
MongoDB schema is more flexible and there is no reason to normalize data (you shouldn't create additional collection to store federated accounts, just store them in user document). Example schemas for `users` collection:
```json
{
  "_id": <ObjectId>,
  "name": "John Doe",
  "email": "johndoe@gmail.com",
  "password": null,
  "googleId": "142984872137006300000",
  "githubId": "42580000"
}
```
> This is the simplest schema you can apply with unique sparse indexes for `googleId` and `githubId`. The biggest disadvantage is that you have to create a separate query for each provider.
```json
{
  "_id": <ObjectId>,
  "name": "John Doe",
  "email": "johndoe@gmail.com",
  "password": null,
  "accounts": [
    { "provider": "google", "subject": "142984872137006300000" },
    { "provider": "github", "subject": "42580000" }
  ]
}
```
> This schema is more generic and you can use the same query for each social auth provider. I think you can create unique compound index for `accounts.provider` and `accounts.subject`.

#### Example flow
I gonna use SQL statements to explain flow. Imagine you are writing Google strategy verification callback and you got object like that:
```js
{
  provider: 'google',
  id: '142984872137006300000',
  displayName: 'John Doe',
  emails: [{ value: 'johndoe@gmail.com', verified: true }],
  ...
}
```
1. Check if social account is already linked:
```sql
SELECT * FROM federated_accounts WHERE provider='google' AND subject='142984872137006300000';
```
2. If federated account found then just authenticate user (create session/JWT) by using `federated_accounts.user_id` field.
3. If federated account **doesn't** exist, then we have to check if user with the email from social provider exists in database:
```sql
SELECT * FROM users WHERE email='johndoe@gmail.com';
```
4. If user with that email exists (for example their id is `20`), then just link another social provider, so create federated account with insert:
```sql
INSERT INTO federated_accounts (provider, subject, user_id) VALUES ('google', '142984872137006300000', 20);
```
5. After successful insert you can create session/JWT for a user with id=20.
6. If user with that email does not exist, create new user and link social provider. I think you should run that query in transaction:
```sql
BEGIN;
  INSERT INTO users (name, email) VALUES ('John Doe', 'johndoe@gmail.com') RETURNING id; ---> id returns 21
  INSERT INTO federated_accounts (provider, subject, user_id) VALUES ('google', '142984872137006300000', 21);
COMMIT; ---> or ROLLBACK; in case of error
```
7. After successful transaction you can create session/JWT for that created user with id=21.

#### Pros:
- good user experience - their social accounts will be automatically linked to an existing account with the same email address.

#### Cons:
- more complex
- you trust a third-party provider to verify email addresses

### Third method - user can login with multiple providers BUT needs to verify email if account already exists
The last featured method is actually extended version of 2nd method. Let's assume you don't want to trust 3rd parties and you prefer to verify emails on your own.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/219873324-49863fc4-624c-44b1-924f-d2b9911ceb13.png)
> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### Example flow
Flow is actually very similar to second method. The only difference is how you create `federated_accounts` entry. You actually create new federated account (link social provider) after email verification.

So if user tries to link new social provider to existing account - you generate random unique token, save entry with user's data in `staged_accounts` and send email to the user. For better security you can hash that verification token with `sha256` before inserting to database, however to the verification link you put the plain token. Don't forget about adding expiration time checks to the `staged_accounts`.

When user clicks verification link -  you hash plain token from link and check if staged account with that token already exists in database.
If it exists you can link new social provider. Now the user can simply use this social provider to log into their account.

#### Pros:
- balanced user experience and security - their social accounts will be automatically linked to existing account with the same email BUT they have to verify email
- you can verify on your own if the user actually controls the specified email address

#### Cons:
- the most complex featured solution and actually not that easy to implement correctly
- user must check their email inbox (it hurts the user experience a bit)

## Code sample
Let's implement [second method](#second-method---user-can-login-with-multiple-providers) in TypeScript and Node.js

### Database setup
I gonna use TypeORM with SQLite driver (I use SQLite to make project easier to run, without requiring knowledge of tools like Docker).

> /setup/db.ts
```ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { FederatedAccount } from '../entities/FederatedAccount';

export const sampleDataSource = new DataSource({
    type: 'sqlite',
    database: "sample.db",
    entities: [User, FederatedAccount],
    synchronize: true,
});

export const userRepository = sampleDataSource.getRepository(User);
export const federatedAccountRepository = sampleDataSource.getRepository(FederatedAccount);

export async function startDatabase() {
    await sampleDataSource.initialize();
}
```

I extended `User` entity with `picture` column. 
> /entities/User.ts
```ts
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FederatedAccount } from './FederatedAccount';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    picture: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    password?: string;

    @OneToMany(() => FederatedAccount, account => account.user)
    accounts: FederatedAccount[];
}
```

> /entities/FederatedAccount.ts
```ts
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Unique
} from "typeorm";
import { User } from "./User";
import { Providers } from "../types";

@Entity('federated_accounts')
@Unique(['provider', 'subject'])
export class FederatedAccount {
    @PrimaryColumn()
    provider: Providers;

    @PrimaryColumn()
    subject: string; // id from provider account

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'user_id'})
    user: User;

    @Column({ name: 'user_id' })
    userId: number;
}
```

### Express.js and middlewares setup
Let's create two simple guard middlewares. We want `/login` and `/register` pages to be available only for guests (unauthenticated users) and `/me` page to be available only for authenticated users. 

> /setup/middlewares.ts
```ts
import { NextFunction, Request, Response } from 'express';

export function authenticatedOnly(req: Request, res: Response, next: NextFunction) {
    if (req.isUnauthenticated()) {
        return res.redirect('/auth/login');
    }

    next();
}

export function guestOnly(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return res.redirect('/me');
    }

    next();
}

```

In `server.ts` I configure Express.js and simply add request handlers for rendering pages like login, register. In profile page `/me` I query database for the currently authenticated user with all connected social accounts.
> /server.ts
```ts
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

    return res.render('me', {
        user,
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


app.listen(3000, () => {
    console.log('Server started');
});
```

### Register and logout
Let's create simple function to generate gravatar URL for every new user registered with "local" provider.
> /utils.ts
```ts
import { createHash } from 'crypto';

export function createGravatar(email: string) {
    const hash = createHash('md5').update(email).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}`;
}
```

Register handler is also nothing special - just query database for user by email address, if user already exists flash error, otherwise hash password and insert new user to database.
> /server.ts - continuation
```ts
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
   });

    req.flash('success', 'Now you can login to created account');
    return res.redirect('/auth/login');
});

app.get('/logout', authenticatedOnly, (req, res) => {
   req.logout({ keepSessionInfo: false }, () => {});
   return res.redirect('/auth/login');
});
```

### Passport setup
In `passport.ts` I decided to put session configuration and obviously passport strategy configurations.

Still nothing special...

> /setup/passport.ts
```ts
import passport from 'passport';
import { Express } from 'express';
import { googleStrategy } from '../strategies/google-strategy';
import { githubStrategy } from '../strategies/github-strategy';
import session from 'express-session';
import { guestOnly } from './middlewares';
import { localStrategy } from '../strategies/local-strategy';

export function setupPassport(app: Express) {
    //  We are using session authentication
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

    // Register all 3 strategies
    passport.use(localStrategy);
    passport.use(googleStrategy);
    passport.use(githubStrategy);

    // Redirects to Google authorization page
    app.get('/auth/google', guestOnly, passport.authenticate('google'));
    // Redirects to GitHub authorization page
    app.get('/auth/github', guestOnly, passport.authenticate('github'));

    // @ts-ignore: for some reason badRequestMessage is not typed
    app.post('/auth/login', guestOnly, passport.authenticate('local', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
        failureFlash: true,
        badRequestMessage: 'Invalid email or password',
    }));

    // Callback endpoints must be definied in OAuth application settings
    app.get('/auth/google/callback', guestOnly, passport.authenticate('google', {
        session: true,
        failureRedirect: '/auth/login',
        successRedirect: '/me',
    }));

    // Callback endpoints must be definied in OAuth application settings
    app.get('/auth/github/callback', guestOnly, passport.authenticate('github', {
        session: true,
        successRedirect: '/me',
        failureRedirect: '/auth/login',
    }));
}
```

### Local login strategy
In the local strategy, I just query the database for the user by email. If the password is undefined, it means the they use a social authentication provider, otherwise I can verify the password and create a session for the user.

> /strategies/local-strategy.ts
```ts
import { Strategy } from 'passport-local';
import { userRepository } from '../setup/db';
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
```

### Google and GitHub strategies
I create simple helper functions to get verified emails and picture from social providers.
> /utils.ts
```ts
import { createHash } from 'crypto';

export function createGravatar(email: string) {
    const hash = createHash('md5').update(email).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}`;
}

interface Picture {
    value: string;
}

export function getPicture(email: string, photosArray?: Picture[]) {
    if (photosArray && photosArray.length) {
        return photosArray[0].value;
    }

    // create gravatar if social provider for some reason doesn't return picture
    return createGravatar(email);
}

export interface GoogleEmail {
    value: string;
    verified: boolean;
}

export function getGoogleEmail(emails?: GoogleEmail[]) {
    if (!emails) {
        return;
    }

    const verifiedEmail = emails.find(email => email.verified);
    if (!verifiedEmail) {
        return;
    }

    return verifiedEmail.value;
}

export interface GithubEmail {
    value: string;
    verified: boolean;
    primary: boolean;
}

export function getGithubEmail(emails?: GithubEmail[]) {
    if (!emails) {
        return;
    }

    const primaryEmail = emails.find(email => email.primary && email.verified);
    if (!primaryEmail) {
        return;
    }

    return primaryEmail.value;
}
```

Code for both social strategies is very similar. As you can see I check if email is verified before I even perform any action. You can also observe two functions:
- `findLinkedAccount` searches for existing social account. Returns user's id.
- `linkAccount` links new social provider to existing account OR creates completely new user. Returns user's id as well.

> /strategies/google-strategy.ts
```ts
import { Strategy } from "passport-google-oauth20";
import { findLinkedAccount, linkAccount } from "../link-account";
import { Providers } from "../types";
import { getGoogleEmail, getPicture } from "../utils";

export const googleStrategy = new Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback',
    scope: ['email', 'profile'],
}, async (_accessToken, _refreshToken, profile, done) => {
    // get email from Google payload - we want only VERIFIED emails
    const email = getGoogleEmail(profile.emails as any);
    if (!email) {
        return done(new Error('Google account email must be verified'));
    }

    // search database for federated account and return userId (implementation details will be later).
    // Remember - search by social account id instead of email.
    const linkedUserId = await findLinkedAccount(Providers.GOOGLE, profile.id);
    if (linkedUserId) {
        return done(null, { id: linkedUserId });
    }

    // if federated account connected to any user doesn't exist, we will search by email.
    const createdUserId = await linkAccount(Providers.GOOGLE, {
        name: profile.displayName,
        email: email,
        picture: getPicture(email, profile.photos),
        subject: profile.id,
    });

    return done(null, { id: createdUserId });
});
```

> /strategies/github-strategy.ts
```ts
import { Strategy, Profile } from 'passport-github2';
import { getGithubEmail, getPicture } from '../utils';
import { findLinkedAccount, linkAccount } from '../link-account';
import { Providers } from '../types';

export const githubStrategy = new Strategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback',
    scope: ['user:email'],
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

    return done(null, { id: createdUserId });
});
```

In the `findLinkedAccount` function we just query the `federated_accounts` table, if federated account found, we return the id of the actual user.
> /link-account.ts
```ts
import { LinkAccountOptions, Providers } from './types';
import {
    federatedAccountRepository,
    sampleDataSource,
    userRepository
} from './setup/db';

export async function findLinkedAccount(provider: Providers, subject: string) {
    const federatedAccount = await federatedAccountRepository.findOneBy({
        provider, subject
    });

    if (!federatedAccount) {
        return;
    }

    return federatedAccount.userId;
}
```

In the `linkAccount` function, we simply search user by email from social provider, if user with that email already exists - we just create new federated account entry linked to existing user. If user does not exist - we register new user and create federated account linked to the created user. 

Last operation is running in transaction to avoid data inconsistency in case of failure.

> /link-account.ts - continuation
```ts
export async function linkAccount(provider: Providers, options: LinkAccountOptions) {
    const { subject, picture, name, email } = options;
    const user = await userRepository.findOneBy({ email });
    if (user) {
        await federatedAccountRepository.save({
            subject,
            provider,
            userId: user.id,
        });

        return user.id;
    }

    return await sampleDataSource.transaction(async t => {
        const newUser = userRepository.create({
            name,
            email,
            picture,
        });

        const createdUser = await t.save(newUser);
        const newFederatedAccount = federatedAccountRepository.create({
            userId: createdUser.id,
            provider,
            subject,
        });

        await t.save(newFederatedAccount);
        return createdUser.id;
    });
}
```
