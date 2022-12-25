const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const GitHubStrategy = require('passport-github').Strategy;

// Module exports as a function
module.exports = function (app, myDataBase) {
  
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
        if (err) return console.error(err);
        done(null, doc);
      });
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

  // Passport use Github Strategy
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://boilerplate-advancednode.makotoaraki.repl.co/auth/github/callback'
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      //Database logic here with callback containing our user object
    }
  ));
}