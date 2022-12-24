const passport = require('passport');
const bcrypt = require('bcrypt');

// Module exports as a function
module.exports = function (app, myDataBase) {
  
  // GET - URL/
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
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

  // POST - URL/auth/github to Github
  app.route('/auth/github').get(
    passport.authenticate('github')
  );

  // GET - URL/auth/github/callback from Github
  app.route('/auth/github/callback').get(
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    }
  )
  
  // 404 Error (Described at the end of all routes)
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
    }
  );
}

// Check if user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};
