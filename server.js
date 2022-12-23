'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');

// App instance
const app = express();

// App use pug engine
app.set('view engine', 'pug');
app.set('views', './views/pug');

// Session Mangement
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Passport initialized
app.use(passport.initialize());

// Session initialized
app.use(passport.session());

// FCC testing
fccTesting(app);

// Basic config
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect Mongo database
myDB(async client => {
  
  // Connect collection
  const myDataBase = await client.db('test').collection('users');

  // GET - URL/
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to database',
      message: 'Please log in',
    });
  });

  // Strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (password !== user.password) { return done(null, false); }
      return done(null, user);
    });
  }));
  
  // User object serialize
  passport.serializeUser(
    (user, done) => {
      done(null, user._id);
    }
  );
  
  // User object deserialize
  passport.deserializeUser(
    (id, done) => {
      myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
    }
  );
  
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
