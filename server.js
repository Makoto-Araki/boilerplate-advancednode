'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth.js');

// App instance
const app = express();

// App create socket
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

// App use pug engine
app.set('view engine', 'pug');
app.set('views', './views/pug');

// App manage session by this options
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));

// App initialize passport
app.use(passport.initialize());

// App initialize passport session
app.use(passport.session());

// FCC testing
fccTesting(app);

// Basic config
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket use Strategy
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

// App connect Mongo database
myDB(async client => {
  
  // App connect collection
  const myDataBase = await client.db('test').collection('users');
  
  // App load route.js
  routes(app, myDataBase);
  
  // App load auth.js
  auth(app, myDataBase);

  // Count of socket communication users
  let currentUsers = 0;

  // Socket receive connection request
  io.on('connection', socket => {

    // User connect to socket
    ++currentUsers;
    io.emit('user', {
      username: socket.request.user.username,
      currentUsers,
      connected: true
    });
    console.log('A user has connected');

    // User disconnect from socket
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user', {
        username: socket.request.user.username,
        currentUsers,
        connected: false
      });
    });
    
  });
  
}).catch(err => {
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database'
    });
  });
});

// When user successed socket auth, it is called
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

// When user failed socket auth, it is called
function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

// Port
const PORT = process.env.PORT || 3000;

// App listening start
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
