var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    User.findOne({ email: email }, function (err, email) {
      if (err) { return done(err); }
      if (!email) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      if (!email.validPassword(password)) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      return done(null, email);
    });
  }
));