import express from "express";
import passport from "../auth/passport.js";
import { hashPassword } from "../auth/password.js";
import { createUser, findUserByUsername, publicUser } from "../db/users.js";
import { validateCredentials } from "../validate.js";

const router = express.Router();

router.get("/me", (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, displayName } = validateCredentials(req.body, {
      withDisplayName: true,
    });

    const existing = await findUserByUsername(username);

    if (existing) {
      res.status(409).json({ error: "That username is taken" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ username, displayName, passwordHash });

    req.login(user, (error) => {
      if (error) {
        next(error);
        return;
      }

      res.status(201).json({ user: publicUser(user) });
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      next(error);
      return;
    }

    if (!user) {
      res.status(401).json({ error: info?.message || "Incorrect username or password" });
      return;
    }

    req.login(user, (loginError) => {
      if (loginError) {
        next(loginError);
        return;
      }

      res.json({ user: publicUser(user) });
    });
  })(req, res, next);
});

router.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    req.session.destroy(() => {
      res.clearCookie("ablation.sid");
      res.json({ ok: true });
    });
  });
});

export default router;
