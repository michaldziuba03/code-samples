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
I decided to make app more eye-appealing with Tailwind :)

> GET /auth/register
<img alt="screenshot" width="700px" src="https://user-images.githubusercontent.com/43048524/219996750-a7d7e813-bd20-40c7-be60-55c348133cd8.png" />

> GET /auth/login
<img alt="screenshot" width="700px" src="https://user-images.githubusercontent.com/43048524/219996868-73e7f59e-9122-44bf-b33a-07e507842f9a.png" />


> GET /me
<img alt="screenshot" width="700px" src="https://user-images.githubusercontent.com/43048524/219996962-31a471bd-18ac-470c-86e0-cf7367107eed.png" />


# Article
If you'd rather read than watch... I also prepared text version.

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
I have seen many tutorials and articles about social login in Node.js, and most of them don't cover the actual integration with the database. This article is not a typical tutorial. I just want to discuss the tricky parts of social authentication, possible database schemas and common mistakes I have observed in other people's code. If you are struggling with a similar problem, I hope you will find this text helpful.

> This article DOESN'T pretend to show you best practices - text is based on my own opinions and thoughts.

Article assumes you are more advanced and you at least know:
1. Express.js and Node.js ecosystem
2. Passport.js
3. TypeScript
4. HTTP Protocol

## Passport.js
Now let's talk a little bit about the most popular auth middleware for Node.js - PassportJS. I found using this library in a modern TypeScript stack to be a bit of a pain for me. Passport just feels a little bit outdated.

### Strategies graveyard
What scares me the most is development activity in PassportJS. According to the official website, Passport.js contains over 500 strategies. Some **official** strategies like `passport-github` are just broken and for that reason I use `passport-github2` in the code sample. Dead strategies are the reason why I maintain my own strategies for my side projects.


<p align="center">
  <img width="670" src="https://user-images.githubusercontent.com/43048524/218758014-3d8ebc5b-a758-4417-bfe1-ccb5b4878795.png" />
</p>

### TypeScript problems
Some types are just incorrect. Here is an example - `profile.emails[0].verified` is actually BOOLEAN, but is typed as string literal.

<img width="600" src="https://user-images.githubusercontent.com/43048524/218768285-762e287a-18b9-476f-a700-2214d49813ba.png" />

I found that option exists by reading a source code of strategy...

<img width="600" src="https://user-images.githubusercontent.com/43048524/218771617-8e1a6dcd-a0db-4524-ba3c-87c0dee80be5.png" />


## OAuth 2.0 standard
We cannot discuss social authentication without mentioning the OAuth 2.0 standard. This standard is a core of most Passport.js strategies, so I think it's important to understand at least the data flow. Most Passport.js strategies use `Authorization Code Flow`, because this flow is suited for a regular server applications.


### OAuth 2.0 Authorization Code Flow example
1. User clicks `Continue with GitHub` button.
2. Button redirects user to GitHub authorization page.
4. After successful authorization, GitHub redirects user back to our application (to callback endpoint) and sends `code` in query params.
5. Our application exchange `code` value for access token by sending code, client id and client secret to GitHub servers.
6. Our application sends an authorized request (with obtained access token) to the GitHub API and retrieves the profile of authorized user.
7. Now we can use that profile data to login or register new account in our system.


## Social login implementation overview
Now let's get to the right part of article. We will be talking about the moment when you get the user's profile in the Passport.js strategy callback. During my little research, I have observed at least 3 ways to implement social authentication.

### Some universal rules and common gotchas
Before we will discuss each social auth implementation, I want to talk about some universal rules that apply to any method:

1. Email address is not reliable for existing account lookup - use social account's unique id instead. In my implementations I use emails only for linking new social provider to existing account OR creating new account. Why email address from social provider is not reliable? Because in some providers you can CHANGE email address and in some implementation I have seen, you will end up with new account in that case :)

2. Email address from social provider must be verified. It's very important if you want to link new social provider to existing account. Why? Because some bad actor can find out that specific email is registered in your application and create new account with that email for example on Google. Bad actor doesn't have access to that email but control Google account with that email. He can use that unverified Google account to get access to legitimate account from your application. 

3. Some providers actually may not return email address. In some providers user can register with phone number - keep that fact in mind. Some possible solutions:
- simply deny social accounts without email address
- prompt user to provide manually email address
- save that phone number as email in your database (you may add additional flag like `hasEmail: false` or something like that).

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
I will briefly explain this method, because in this article we will focus actually on second method.
1. Find user by provider and social account id
2. If user already exists - create session/JWT
3. If user doesn't exists - create new one using profile data from social provider (email, social account id, displayName). Make sure email is not already taken.

#### Pros:
- easiest to implement

#### Cons:
- bad user experience - most people expects your application to link their social accounts connected to the same email address

### Second method - user can login with multiple providers
The second method is most common implementation but is also more complex and requires 2 entities. User can link multiple authentication providers (connected to the same email address) to a single account.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/219093100-36628861-ea9f-4dc7-bf49-862a1a4275fd.png)
> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### MongoDB
MongoDB schema is more flexible and there is no reason to normalize data (you probably shouldn't create additional collection to store federated accounts, just store them in user document). Example schemas for `users` collection:

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
> This schema is more generic and you can use same query for each social auth provider. I think you can create unique compound index for `accounts.provider` and `accounts.subject`.

#### Example flow
I gonna use SQL statements to explain flow. Imagine you are writing Google strategy verification callback and you got object like: 
```js
{
  provider: 'google',
  id: '142984872137006300000',
  displayName: 'John Doe',
  emails: [{ value: 'johndoe@gmail.com', verified: true }],
  ...
}
```
1. Check if social account is already linked with query like:
```sql
SELECT * FROM federated_accounts WHERE provider='google' AND subject='142984872137006300000';
```
2. If federated account found then just create session/JWT by using `federated_accounts.user_id` field.
3. If federated account does not exists, that means we have to check if user with email from social provider exists in database with query like:
```sql
SELECT * FROM users WHERE email='johndoe@gmail.com';
```
4. If user with that email exists (for example id is `20`) that means we want to just link another social provider, so create federated account with insert:
```sql
INSERT INTO federated_accounts (provider, subject, user_id) VALUES ('google', '142984872137006300000', 20);
```
5. After successful insert you can create session/JWT for a user with id=20.
6. If user with that email does not exist, create brand new user and link social provider. I think you should run that query in transaction:
```sql
BEGIN;
  INSERT INTO users (name, email) VALUES ('John Doe', 'johndoe@gmail.com') RETURNING id; ---> id returns 21
  INSERT INTO federated_accounts (provider, subject, user_id) VALUES ('google', '142984872137006300000', 21);
COMMIT; ---> or ROLLBACK; in case of error
```
7. After successful transaction you can create session/JWT for that created user with id=21.

#### Pros:
- good user experience - their social accounts will be automatically linked to existing account with the same email.

#### Cons:
- more complex
- you put the trust to the 3rd party providers they verified email

### Third method - user can login with multiple providers BUT needs to verify email if account already exists
The last featured method is actually extended version of 2nd method. Let's assume you don't want to trust 3rd parties if they verified email - you want to verify on your own.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/219873324-49863fc4-624c-44b1-924f-d2b9911ceb13.png)
> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### Example flow
Flow is actually very similar to second method. The only difference is how you create `federated_accounts` entry. You actually create `federated_accounts` after email verification.

So if user tries to link new social provider to existing account - you generate unique token, save entry with user's data in `staged_accounts` and send email to the user. For additional security you can hash that verification token with `sha256` before inserting to database, but to the verification link you put plain token.

When user clicks verification link -  you basically take than plain token, hash token and check if `staged_account` with that token already exist in database.
If exists you link new social provider account. Now user can just use that social provider to login to their account.

#### Pros:
- balanced user experience and security - their social accounts will be automatically linked to existing account with the same email BUT they have to login to the email and click the verification link.
- you can verify on your own if user actually controls that email address

#### Cons:
- most complex and actually not that easy to implement correctly

## Code sample
Let's implement second method in TypeScript and Node.js

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
Let's create two simple guard middlewares. We want login and register pages to be available only for guests (unauthenticated users) and profile page to be available only for authenticated users. 

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

In `server.ts` I configure Express.js and simply add request handlers for rendering pages like login, register. In profile page `/me` I query database for user with connected social accounts.
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
I create simple function to generate gravatar URL for every new user registered with "local" provider.
> /utils.ts
```ts
import { createHash } from 'crypto';

export function createGravatar(email: string) {
    const hash = createHash('md5').update(email).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}`;
}
```

Register handler is also nothing special - just query user by email address, if user already exists flash error, otherwise hash password and insert new user to database.
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
In `passport.ts` I decided to put session configuration, standard passport configurations. I also added 3 strategies:
- Google
- GitHub
- Local

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

```

### Local login strategy
In local strategy I simply query user by email, if password is undefined that means user uses social auth provider. If password is definied I can verify with my hash function, if passwords are the same - I create session for user.

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

Code for both social strategies is very similar. As you can see I check if email is verified before I perform any action. You can also observe two functions:
- `findLinkedAccount` searches for existing social account
- `linkAccount` as you can guess link new social provider to existing account OR create completely new user.

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
    const email = getGoogleEmail(profile.emails as any);
    if (!email) {
        return done(new Error('Google account email must be verified'));
    }

    const linkedUserId = await findLinkedAccount(Providers.GOOGLE, profile.id);
    if (linkedUserId) {
        return done(null, { id: linkedUserId });
    }

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
