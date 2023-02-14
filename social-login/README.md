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

## Intro
I have seen many tutorials and articles about social login in Node.js, and most of them don't cover the actual integration with the database. This article is not a typical tutorial. I just want to discuss the tricky parts of social authentication, possible database schemas and common mistakes I have observed in other people's code. If you are struggling with a similar problem, I hope you will find this text helpful.

> This article does not pretend to show you best practices - text is based on my own opinions and thoughts.

## Passport.js
Now let's talk a little bit about the most popular auth middleware for Node.js - PassportJS. I found using this library in a modern TypeScript stack to be a bit of a pain for me. Passport just feels a little bit outdated.

### Strategies graveyard
What scares me the most is development activity in PassportJS. According to the official website, Passport.js contains over 500 strategies. Some **official** strategies like `passport-github` are just broken and for that reason I use `passport-github2` in the code sample. Dead strategies are the reason why I maintain my own strategies for my side projects.


<p align="center">
  <img width="670" src="https://user-images.githubusercontent.com/43048524/218758014-3d8ebc5b-a758-4417-bfe1-ccb5b4878795.png" />
</p>

### TypeScript problems
Some types are just incorrect. Here is example - `profile.emails[0].verified` is actually BOOLEAN, but is typed as string literal.

<img width="600" src="https://user-images.githubusercontent.com/43048524/218768285-762e287a-18b9-476f-a700-2214d49813ba.png" />

I found that option exists by reading a source code of strategy...

<img width="600" src="https://user-images.githubusercontent.com/43048524/218771617-8e1a6dcd-a0db-4524-ba3c-87c0dee80be5.png" />


## OAuth 2.0 standard
We cannot discuss social authentication without mentioning the OAuth 2.0 standard. This standard is a core of most Passport.js strategies, so I think it's important to understand at least the data flow.

### OAuth 2.0 flow example (simplified)
1. User clicks `Continue with GitHub` button.
2. Button redirects user to GitHub authorization page.
3. After successful authorization, GitHub redirects user back to our application (to callback endpoint) and send `code` in query params.
4. Our application exchange `code` value for access token by sending code, client id and client secret to GitHub servers.
5. Our application sends an authorized request (with obtained access token) to the GitHub API and retrieves the profile of authorized user.
6. Now we can use that profile data to login or register new account in our system.


