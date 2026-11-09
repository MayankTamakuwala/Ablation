import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { findUserById, findUserByUsername } from "../db/users.js";
import { verifyPassword } from "./password.js";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await findUserByUsername(username);

      // The same message for both failures, so the form does not reveal
      // which usernames exist.
      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      }

      const matches = await verifyPassword(password, user.passwordHash);

      if (!matches) {
        return done(null, false, { message: "Incorrect username or password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, String(user._id));
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

export function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }

  res.status(401).json({ error: "Sign in to continue" });
}

export default passport;
