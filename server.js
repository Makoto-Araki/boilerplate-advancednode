'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

// App instance
const app = express();

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

  // GET - URL/
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
    });
  });

  // POST - URL/login with Passport
  app.route('/login').post(
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    }
  );

  // GET - URL/profile
  app.route('/profile').get(
    ensureAuthenticated,
    (req, res) => {
      res.render('/profile', {
        username: req.user.username
      });
    }
  );

  // GET - URL/logout
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  // POST - URL/register
  app.route('/register').post(
    (req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          })
        }
      })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );
  
  // 404 Error (Described at the end of all routes)
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
    }
  );
  
  // Passport use Strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
      return done(null, user);
    });
  }));
  
  // Passport serialize user object
  passport.serializeUser(
    (user, done) => {
      done(null, user._id);
    }
  );
  
  // Passport deserialize user object
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

// Check if user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// Port
const PORT = process.env.PORT || 3000;

// App listening start
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
