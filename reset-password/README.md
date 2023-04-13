<p align="center">
  <img width="700" alth="thumbnail" src="https://user-images.githubusercontent.com/43048524/220446626-b12fe333-b662-48e5-a28b-93193e70926b.png" />
</p>

<h1 align="center"> Reset password in Node.js </h1>
<p align="center"> 
  Node.js • TypeScript • NodeMailer • Express.js
</p>

## Setup and run
Clone repository:
```
git clone git@github.com:michaldziuba03/samples.git
cd samples/reset-password
```

Install dependencies with npm:
```
npm install
```

Create .env file and replace sample values with your own credentials:
```yml
SMTP_HOST='localhost'
SMTP_PORT=587
SMTP_USER='user'
SMTP_PASS='password'

URL='http://localhost:3000'
```
> For email testing you can use services like [Ethereal Email](https://ethereal.email) or [Mailtrap](https://mailtrap.io)

Now you can run application:
```
npm run dev
```

## Screenshots
> Login page

![image](https://user-images.githubusercontent.com/43048524/231877100-541542ea-fb3e-4153-82f8-d926f4f4d30e.png)

> Forgot password request page

![image](https://user-images.githubusercontent.com/43048524/231877005-5a459011-4cbb-4f28-9943-5d4b0b4bafff.png)

>  Reset link sent page

![image](https://user-images.githubusercontent.com/43048524/231877326-25ee172d-3fae-48ef-97af-4b6db07343e6.png)

> Email message with reset link

![image](https://user-images.githubusercontent.com/43048524/231877555-636900ae-8d8b-4e0d-b6af-66534bb6208e.png)

