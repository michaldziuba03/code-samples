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

#### Pros:
- easiest to implement

#### Cons:
- bad user experience - most people expects your application to link their social accounts connected to the same email address

### Second method - user can login with multiple providers
The second is more complex and requires 2 entities. User can link multiple authentication providers (connected to the same email address) to a single account.

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
![image](https://user-images.githubusercontent.com/43048524/219123088-7c755fb8-a87a-47b6-b6ae-70928ee51acf.png)
> Entity diagram generated with [dbdiagram.io](https://dbdiagram.io/)

#### Pros:
- balanced user experience and security - their social accounts will be automatically linked to existing account with the same email BUT they have to login to the email and click the verification link.
- you can verify on your own if user actually controls that email address

#### Cons:
- most complex and actually not that easy to implement correctly
