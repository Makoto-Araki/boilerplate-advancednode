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

// App use pug engine
app.set('view engine', 'pug');
app.set('views', './views/pug');

// App manage session by this options
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
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
    
    // Connect
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');

    // Disconnect
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user count', currentUsers);
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

// Port
const PORT = process.env.PORT || 3000;

// App listening start
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
