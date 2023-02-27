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
        <li><a href="#is-passportjs-so-bad">Is Passport.js so bad?</a></li>
      </ul>
    </li>
    <li>
      <a href="#oauth-20-standard">OAuth 2.0 standard</a>
      <ul><li><a href="#oauth-20-authorization-code-flow-example">OAuth 2.0 Authorization Code Flow example</a></li></ul>
      <ul><li><a href="#additional-resources-about-oauth-20">Additional resources about OAuth 2.0</a></li></ul>
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
      <a href="#common-security-flaws">Common security flaws</a>
      <ul>
        <li><a href="#pre-account-takeover">Pre Account Takeover</a></li>
        <li><a href="#linking-unverified-social-accounts">Linking unverified social accounts</a></li>
      </ul>
    </li>
    <li>
      <a href="#code-sample">Code Sample</a>
      <ul>
        <li><a href="#database-setup">Database setup</a></li>
        <li><a href="#expressjs-and-middlewares-setup">Express.js and middlewares setup</a></li>
        <li><a href="#views-setup">Views setup</a></li>
        <li><a href="#register-and-logout">Register and logout</a></li>
        <li><a href="#passport-setup">Passport setup</a></li>
        <li><a href="#local-login-strategy">Local login strategy</a></li>
        <li><a href="#google-and-github-strategies">Google and GitHub strategies</a></li>
      </ul>
    </li>
    <li>
      <a href="#summary">Summary</a>
      <ul>
        <li><a href="#additional-resources">Additional resources</a></li>
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
What scares me the most in PassportJS? The development activity of strategies (core library is doing fine). According to the official website, Passport.js contains over 500 strategies and some of them, even **official** strategies like `passport-github` are just [kinda broken](https://github.com/jaredhanson/passport-github/issues/75). For that reason I use `passport-github2` in the code sample.


<p align="center">
  <img width="670" src="https://user-images.githubusercontent.com/43048524/218758014-3d8ebc5b-a758-4417-bfe1-ccb5b4878795.png" />
</p>

### TypeScript problems
Some types are just incorrect. Here is an example: `profile.emails[0].verified` is actually BOOLEAN, but is typed as string literal.

<img width="600" src="https://user-images.githubusercontent.com/43048524/218768285-762e287a-18b9-476f-a700-2214d49813ba.png" />

I found this option exists by reading a source code of strategy...

<img width="600" src="https://user-images.githubusercontent.com/43048524/218771617-8e1a6dcd-a0db-4524-ba3c-87c0dee80be5.png" />

### Is Passport.js so bad?
Personally, I don't like Passport.js as it is. Frameworks like Nest.js often provides some sort of wrapper for Passport.js which makes it less painful with TypeScript. I also maintain my own strategies for my side projects. They are properly typed because they are written from scratch in TypeScript. All these things together give me a decent experience.

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

### Additional resources about OAuth 2.0
- [An introduction to OAuth 2](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)
- [What is OAuth 2](https://auth0.com/intro-to-iam/what-is-oauth-2)
- [Which OAuth 2.0 flow should I use](https://auth0.com/docs/get-started/authentication-and-authorization-flow/which-oauth-2-0-flow-should-i-use)
- [OAuth Best practice](https://oauth.net/2/oauth-best-practice/)

## Social login implementation overview
Now let's move on to the actual part of the article. We will be talking about the moment when you get the user's profile in the Passport.js strategy callback. During my research, I have observed at least 3 ways to implement social authentication.

### Some universal rules and common gotchas
Before we will discuss each social auth implementation method, I want to mention a few universal rules that apply to any method:

1. Email address is not reliable for existing account lookup - use social account's id instead. In my implementations I use emails only for linking **NEW** social provider to existing account OR creating new account. Why email address from social provider is not reliable? Because in some providers you can **CHANGE** email address and in many implementations I've seen, you will end up with new account in that case :)

2. Email address from social provider must be verified. It's very important if you want to link new social provider to existing account. Why? Because some bad actor can find out that a particular email is registered in your application and create a new Google (as example) account with that email address. Bad actor can use that unverified Google account to get access to legitimate account from your application. We will discuss this type of attack in [Linking unverified social accounts](#linking-unverified-social-accounts) section.

3. You should implement email verification mechanism in your application. It's very important if you want to link new social provider to existing account (registered with email and password). Bad actor can create an account in your application with someone's email address. If after some time the legitimate email owner will sign up with social login, bad actor can access this account. We will discuss this type of attack in [Pre Account Takeover](#pre-account-takeover) section. Make sure that **ONLY** verified accounts can link social providers.

4. Some providers may not return the email address. In some providers user can register with a phone number. You can simply deny social accounts without email or save phone number (if returned) in email column/field.

### First method - user can login with ONLY one provider
The first method is fairly simple. User can use only one authentication method for specific email. That means you cannot link your Google account if you registered with Github provider previously.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/221054002-07000294-0215-453f-a38f-c34657be27bd.png)

> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### Example flow
I will briefly explain this method, because I want to focus actually on second method.
1. Find user by provider and social account id (providerId).
2. If user already exists - create session/JWT for them.
3. If user doesn't exists - create new user with data from social provider (email, social account id, displayName). Make sure email is not already taken.
4. Create session/JWT for created user.

#### Pros:
- easiest to implement

#### Cons:
- bad user experience - most people expect your application to link their social accounts connected to the same email address

### Second method - user can login with multiple providers
The second method is the most common implementation but is also more complex. User can link multiple authentication providers (connected to the same email address) to a single account.

#### Relational databases
![image](https://user-images.githubusercontent.com/43048524/221053441-ec972f99-85bd-4c4f-920e-18d7f5b6fb26.png)

> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### MongoDB
MongoDB schema is more flexible and there is no reason to normalize data (you shouldn't create additional collection to store federated accounts, just store them in user document). Example schemas for `users` collection:
```json
{
  "_id": <ObjectId>,
  "name": "John Doe",
  "email": "johndoe@gmail.com",
  "isVerified": true,
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
  "isVerified": true,
  "password": null,
  "accounts": [
    { "provider": "google", "subject": "142984872137006300000" },
    { "provider": "github", "subject": "42580000" }
  ]
}
```
> This schema is more generic and you can use the same query for each social auth provider. I think you can create unique compound index for `accounts.provider` and `accounts.subject`.

#### Example flow
I gonna use SQL statements to explain flow. Imagine you are writing Google strategy verification callback and you got object like this:
```js
{
  provider: 'google',
  id: '142984872137006300000',
  displayName: 'John Doe',
  emails: [{ value: 'johndoe@gmail.com', verified: true }],
  ...
}
```
1. Make sure that email adress from social provider is verified.
2. Check if social account is already linked:
```sql
SELECT * FROM federated_accounts WHERE provider='google' AND subject='142984872137006300000';
```
3. If federated account found then just authenticate user (create session/JWT) by using `federated_accounts.user_id` field.
4. If federated account **doesn't** exist, then we have to check if user with the email from social provider exists in database:
```sql
SELECT * FROM users WHERE email='johndoe@gmail.com';
```
5. If user with that email exists (for example their id is `20`) and their email is verified, then just link another social provider, so create federated account with insert:
```sql
INSERT INTO federated_accounts (provider, subject, user_id) VALUES ('google', '142984872137006300000', 20);
```
6. After successful insert you can create session/JWT for a user with id=20.
7. If user with that email does not exist, create new user and link social provider. I think you should run that query in transaction:
```sql
BEGIN;
  INSERT INTO users (name, email) VALUES ('John Doe', 'johndoe@gmail.com') RETURNING id; ---> id returns 21
  INSERT INTO federated_accounts (provider, subject, user_id) VALUES ('google', '142984872137006300000', 21);
COMMIT; ---> or ROLLBACK; in case of error
```
8. After successful transaction you can create session/JWT for the created user.

#### Pros:
- good user experience - their social accounts will be automatically linked to an existing account with the same email address.

#### Cons:
- more complex
- you trust a third-party provider to verify email addresses

### Third method - user can login with multiple providers BUT needs to verify email if account already exists
The last featured method is actually extended version of 2nd method. Let's assume you don't want to trust 3rd parties and you prefer to verify emails on your own.

#### Relational databases
![3rd diagram](https://user-images.githubusercontent.com/43048524/221438100-b268e4b5-57d9-4c48-bd20-0949f2d3d21c.png)

> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### Example flow
Flow is actually very similar to second method. The only difference is how you create `federated_accounts` entry. You actually create new federated account (link social provider) after email verification.

So if user tries to link new social provider to existing account - you generate random unique token, save entry with user's data in `staged_accounts` and send email to the user. For better security you can hash that verification token with `sha256` before inserting to database, however to the verification link you put the plain token. Don't forget about adding expiration time checks.

When user clicks verification link -  you hash the plain token from link and check if staged account with that token already exists in database.
If it exists and hasn't expired you can link new social provider. Now the user can simply use this social provider to log into their account.

#### Pros:
- balanced user experience and security - their social accounts will be automatically linked to existing account with the same email BUT they have to verify email
- you can verify on your own if the user actually controls the specified email address

#### Cons:
- the most complex featured solution and actually not that easy to implement correctly
- user must check their email inbox (it hurts the user experience a bit)

## Common security flaws
In this section we will discuss typical vulnerabilities in social login implementations.

### Pre Account Takeover
A pre-account takeover is when an attacker creates a user account with local provider (email and password) using victim's email and after some time the victim signs up with another login method. The application then links the two accounts together based on the matching email address.

#### Attack requirements
- no checks if the local email address is verified when linking social account (or lack of email verification mechanism at all).
- attacker must know the victim's email address.

#### Attack steps
1.&nbsp;Attacker registers new account (in your app) with victim's email address.

<img width="450" src="https://user-images.githubusercontent.com/43048524/221339034-54d55171-b782-4bd4-a578-a2f94de03aa4.png"/>

2.&nbsp;After some time victim signs up with social login provider connected to the same email.

<img width="500" src="https://user-images.githubusercontent.com/43048524/221339078-0938e1d6-4cde-483f-9196-98642d8a232c.png"/>

3.&nbsp;Attacker has access to the victim's account

#### Fix
- Deny unverified accounts from **your** application to link new social providers.

### Linking unverified social accounts
Similar vulnerability to previous one but you’d be attacking from the other direction. Imagine that the victim register in your application with some provider. Attacker can use the victim's email to register new unverified account on another provider's website and sign up in your application with this provider. The application then links the two accounts together based on the matching email address.

#### Attack requirements
- OAuth provider does not require email verification (it's actually very uncommon).
- no checks if email from social provider is verified.
- attacker must know the victim's email address.

#### Attack steps
1.&nbsp;Victim registers new account in your app (with any available login method)

<img width="500" src="https://user-images.githubusercontent.com/43048524/221338983-02386830-c169-4c69-98e3-424f1e5009cf.png"/>

2.&nbsp;Attacker finds out that victim's email is registered in your application

3.&nbsp;Attacker registers new account in social provider application

<img width="640" src="https://user-images.githubusercontent.com/43048524/221339168-11ec9cb1-4b73-4fa4-8d66-a25cdde1621d.png"/>

> I'm just showing Google as an example but with Google this attack is impossible - actually Google requires email verification to complete the signup process at all. The same thing applies for many other OAuth providers. I want to make sure you are aware of this type of attack even if your OAuth providers require email address to be verified.

4.&nbsp;Attacker signs in with social provider using unverified account

<img width="500" src="https://user-images.githubusercontent.com/43048524/221339806-632347ad-560a-4ace-8ab9-d85011109d5e.png"/>

5.&nbsp;Attacker has access to the victim's account

#### Fix
- check if email address from social provider is verified (many OAuth providers gives you information if email is verified or not).
- you can implement [3rd method](#third-method---user-can-login-with-multiple-providers-but-needs-to-verify-email-if-account-already-exists) to verify emails from social providers on your own.
- most OAuth providers actually refuse to authorize unverified accounts.

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

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

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
import { User } from './User';
import { Providers } from '../types';

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
Let's create two simple guard middlewares. We want page like `/login` and `/register` to be available only for guests (unauthenticated users) and `/me` page to be available only for authenticated users. 

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

In `server.ts` I configure Express.js and simply add request handlers for rendering pages. In profile page `/me` I query database for the currently authenticated user with their all connected social accounts.
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


app.listen(3000, () => {
    console.log('Server started');
});
```

### Views setup
I use EJS for HTML templates and Tailwind for styles. The simplest approach is to use the `<a>` element for social login buttons. In the [Passport setup](#passport-setup) section we will configure `/auth/google` and `/auth/github` routes. These paths will redirect users to the provider authorization page.

> /views/login.ejs
```ejs
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href="/style.min.css" rel="stylesheet">
    <title>Login page</title>
</head>
<body>
    <div class="flex min-h-screen justify-center items-center login-bg">
        <div class="bg-white sm:drop-shadow-xl py-11 px-8 rounded w-full sm:w-auto">
            <h1 class="text-2xl font-bold mb-8">Welcome back</h1>
            <form method="post" action="/auth/login" class="flex flex-col gap-2 sm:w-96">
                <a class="social-btn" href="/auth/google">
                    <img src="/google.svg" alt="Google logo" />
                    Continue with Google
                </a>
                <a class="social-btn" href="/auth/github">
                    <img src="/github.svg" alt="GitHub logo" />
                    Continue with Github
                </a>

                <div class="flex justify-center items-center gap-4 my-4 select-none">
                    <hr class="border-gray-400 w-full"/>
                    <span class="text-gray-400">OR</span>
                    <hr class="border-gray-400 w-full"/>
                </div>

                <% if (messages.success) { %>
                    <div class="border border-green-600 bg-green-100 text-green-600 flex items-center my-3 p-3 rounded gap-3">
                        <%= messages.success %>
                    </div>
                <% } %>

                <% if (error) { %>
                    <div class="error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 11H9V5H11M11 15H9V13H11M10 0C8.68678 0 7.38642 0.258658 6.17317 0.761205C4.95991 1.26375 3.85752 2.00035 2.92893 2.92893C1.05357 4.8043 0 7.34784 0 10C0 12.6522 1.05357 15.1957 2.92893 17.0711C3.85752 17.9997 4.95991 18.7362 6.17317 19.2388C7.38642 19.7413 8.68678 20 10 20C12.6522 20 15.1957 18.9464 17.0711 17.0711C18.9464 15.1957 20 12.6522 20 10C20 8.68678 19.7413 7.38642 19.2388 6.17317C18.7362 4.95991 17.9997 3.85752 17.0711 2.92893C16.1425 2.00035 15.0401 1.26375 13.8268 0.761205C12.6136 0.258658 11.3132 0 10 0Z" fill="#D20F1B"/>
                        </svg>
                        <%= error %>
                    </div>
                <% } %>

                <div class="flex flex-col">
                    <label for="email-input" class="text-sm">Email</label>
                    <input name="email" class="form-element" required type="email" placeholder="Enter email" id="email-input">
                </div>

                <div class="flex flex-col">
                    <label for="password-input" class="text-sm">Password</label>
                    <input name="password" class="form-element" required type="password" placeholder="Enter password" id="password-input">
                </div>

                <button class="btn" type="submit">Sign In</button>

                <span class="text-center text-gray-600">Don’t have an account?&nbsp;
                    <a class="font-bold text-gray-800" href="/auth/register">Sign up </a>
                </span>
            </form>
        </div>
    </div>
</body>
</html>
```

> /views/register.ejs
```ejs
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href="/style.min.css" rel="stylesheet">
    <title>Register</title>
</head>
<body>
<div class="flex min-h-screen justify-center items-center login-bg">
    <div class="bg-white sm:drop-shadow-xl py-11 px-8 rounded w-full sm:w-auto">
        <h1 class="text-2xl font-bold mb-8">Create new account</h1>
        <form method="post" action="/auth/register" class="flex flex-col gap-2 sm:w-96">
            <a class="social-btn" href="/auth/google">
                <img src="/google.svg" alt="Google logo" />
                Continue with Google
            </a>
            <a class="social-btn" href="/auth/github">
                <img src="/github.svg" alt="Google logo" />
                Continue with Github
            </a>

            <div class="flex justify-center items-center gap-4 my-4 select-none">
                <hr class="border-gray-400 w-full"/>
                <span class="text-gray-400">OR</span>
                <hr class="border-gray-400 w-full"/>
            </div>

            <% if (error) { %>
                <div class="error">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 11H9V5H11M11 15H9V13H11M10 0C8.68678 0 7.38642 0.258658 6.17317 0.761205C4.95991 1.26375 3.85752 2.00035 2.92893 2.92893C1.05357 4.8043 0 7.34784 0 10C0 12.6522 1.05357 15.1957 2.92893 17.0711C3.85752 17.9997 4.95991 18.7362 6.17317 19.2388C7.38642 19.7413 8.68678 20 10 20C12.6522 20 15.1957 18.9464 17.0711 17.0711C18.9464 15.1957 20 12.6522 20 10C20 8.68678 19.7413 7.38642 19.2388 6.17317C18.7362 4.95991 17.9997 3.85752 17.0711 2.92893C16.1425 2.00035 15.0401 1.26375 13.8268 0.761205C12.6136 0.258658 11.3132 0 10 0Z" fill="#D20F1B"/>
                    </svg>
                    <%= error %>
                </div>
            <% } %>

            <div class="flex flex-col">
                <label for="email-input" class="text-sm">Email</label>
                <input name="email" class="form-element" required type="email" placeholder="Enter email" id="email-input">
            </div>

            <div class="flex flex-col">
                <label for="name-input" class="text-sm">Name</label>
                <input name="name" class="form-element" required type="text" placeholder="Enter name" id="name-input">
            </div>

            <div class="flex flex-col">
                <label for="password-input" class="text-sm">Password</label>
                <input name="password" class="form-element" required type="password" placeholder="Enter password" id="password-input">
            </div>

            <button class="btn" type="submit">Sign Up</button>

            <span class="text-center text-gray-600">Already have an account?&nbsp;
                    <a class="font-bold text-gray-800" href="/auth/login">Sign in </a>
                </span>
        </form>
    </div>
</div>
</body>
</html>
```

> /views/me.ejs
```ejs
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href="/style.min.css" rel="stylesheet">
    <title>Profile (<%= user.name %>)</title>
</head>
<body>
<div class="flex flex-col gap-5 min-h-screen justify-center items-center">
    <img class="rounded-full w-40 h-40" alt="avatar" src="<%= user.picture %>" />
    <h1 class="text-xl font-bold"><%= user.name %></h1>

    <% if (user.accounts.length) { %>
        <% for (const account of user.accounts) { %>
            <div class="flex justify-center items-center w-64 gap-2 p-3 border rounded capitalize select-none">
                <img src="/<%= account.provider %>.svg" alt="<%= account.provider %> logo" />
                <%= account.provider %>
            </div>
        <% } %>
    <% } else { %>
        <div class="flex text-gray-600 justify-center items-center w-64 gap-2 p-3 border rounded capitalize select-none">
            No external auth providers
        </div>
    <% } %>

    <a href="/logout" class="btn mt-12">Logout</a>
</div>
</body>
</html>
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
       /*
        IMPORTANT: we register users as always verified because we haven't email-verification mechanism.
        You should always register users with isVerified: false by default, and change it to "true" in email-verification route.
        Email verification mechanism is out of scope of this guide.
       */
       isVerified: true,
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
In the local strategy, I just query the database for the user by email. If the password is undefined, it means they are using a social authentication provider, otherwise I can verify the password and create a session for the user.

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
    
    if (!createdUserId) {
        return done(new Error('Google account cannot be linked'));
    }
    
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
    
    if (!createdUserId) {
        return done(new Error('GitHub account cannot be linked'));
    }

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

In the `linkAccount` function, we simply search user by email from social provider, if user with that email already exists - we just create new federated account linked to the existing user. If user does not exist - we register new user and create federated account linked to the created user. 

Last operation is running in transaction to avoid data inconsistency in case of failure.

> /link-account.ts - continuation
```ts
export async function linkAccount(provider: Providers, options: LinkAccountOptions) {
    const { subject, picture, name, email } = options;
    const user = await userRepository.findOneBy({ email });
    if (user && !user.isVerified) {
        /*
          IMPORTANT: Abort linking account process, to prevent pre-Authentication Account Takeover attack.
          If user already exists in our database and their email address is unverified, you should disallow social account linking.
        */
        return;
    }

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
            // as we deny unverified emails from social providers I think we can create user as verified:
            isVerified: true,
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

## Summary
Thanks for reading this guide, I hope you found it helpful and interesting. Any feedback is welcome. Let me know if you know a better approach :)

### Additional resources
- [Sample application with Facebook login](https://github.com/passport/todos-express-facebook)
- [Auth0 user profile schema](https://auth0.com/docs/manage-users/user-accounts/user-profiles/normalized-user-profile-schema)
- [Google OAuth2 login without Passport.js video](https://www.youtube.com/watch?v=idqhYcXxbPs)
- [GitHub OAuth2 login without Passport.js video](https://youtu.be/qUE4-kSlPIk)
- [Official GitHub docs about authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [All about Account Takeover](https://infosecwriteups.com/all-about-account-takeover-825d8fcf2d57)
- [Attacking Social Logins: Pre-Authentication Account Takeover](https://hbothra22.medium.com/attacking-social-logins-pre-authentication-account-takeover-790248cfdc3)
- [OAuth Misconfiguration Leads To Pre-Account Takeover](https://infosecwriteups.com/oauth-misconfiguration-leads-to-pre-account-takeover-8f94c1ef50be)
- [Pre-account takeover and Badoo report](https://hackerone.com/reports/1074047)
- [Social login "SpoofedMe" attack](https://www.eecs.yorku.ca/course_archive/2014-15/W/3482/Team19_presentation.pdf)
- [Account pre-hijacking](https://en.wikipedia.org/wiki/Account_pre-hijacking)
- [What is account pre-hijacking](https://www.makeuseof.com/what-is-account-pre-hijacking/)
