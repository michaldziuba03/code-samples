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
I have seen many tutorials and articles about social login in Node.js, and most of them don't cover the actual integration with the database. This article is not a typical tutorial. I just want to discuss the tricky parts of social authentication. We will discuss possible database schemas and common mistakes I have observed in other people's code. If you are struggling with a similar problem, I hope you will find this text helpful.

## OAuth 2.0 standard
We cannot discuss social authentication without mentioning the OAuth 2 standard.
