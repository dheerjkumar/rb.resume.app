const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        const email = profile.emails[0].value;
        const isUserAdmin = email === process.env.ADMIN_EMAIL;

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email,
            name: profile.displayName,
            profilePhoto: profile.photos[0].value,
            isAdmin: isUserAdmin,
          });
        } else if (user.isAdmin !== isUserAdmin) {
          user.isAdmin = isUserAdmin;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
