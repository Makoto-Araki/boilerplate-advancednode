'use strict';
require('dotenv').config();
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const strategy = require('passport-local').Strategy;
const app = express();
const { ObjectID } = require('mongodb');

// App use pug engine
app.set('views', './views/pug');
app.set('view engine', 'pug');

// Basic Config
fccTesting(app);
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Mangement
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serialize Function
passport.serializeUser(
  (user, done) => {
    return done(null, user._id);
  }
);

// Deserialize Function
passport.deserializeUser(
  (id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, null);
    });
  }
);

// Passport initialized
app.use(passport.initialize());

// Session initialized
app.use(passport.session());

// Connect Mongo database
myDB(async client => {
  //
}).catch(err => {
  //
});

app.route('/').get((req, res) => {
  res.render('index', {
    title: 'Hello',
    message: 'Please log in',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
