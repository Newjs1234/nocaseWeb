const http = require('http'),
      path = require('path');

const express = require('express'),
      session = require('express-session'),
      bodyParser = require('body-parser'),
      ejs = require('ejs');

const app = express();

const routerFilm = require('./routers/routerFilm');

const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    SESS_SECRET = 'ssh!quiet,it\'asecret',
    SESS_LIFETIME = TWO_HOURS
} = process.env

const IN_PROD = NODE_ENV === 'production'

app.use(bodyParser.urlencoded({
    extended: true
}))

// Session
app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
        naxAge: SESS_LIFETIME,
        sameSite: true,
        secure: IN_PROD
    }
}))

app.use('/', express.static('public'));
app.set('view engine', 'ejs');

app.use('/', routerFilm);

const server = http.createServer(app);

server.listen(80, () => {
    console.log('Server port 80');
});