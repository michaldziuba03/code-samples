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
