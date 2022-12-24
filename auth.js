const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

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
  
}