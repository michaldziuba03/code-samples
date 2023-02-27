import 'reflect-metadata';
import { config } from 'dotenv';
config();
import express from 'express';
import { startDatabase } from './setup/db';

startDatabase();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    return res.render('index', { message: 'Hello world' });
});

app.listen(3000, () => {
    console.log('Server started');
});
