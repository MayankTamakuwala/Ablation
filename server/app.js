import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "./auth/passport.js";
import { DB_NAME, getClientPromise } from "./db/client.js";
import authRouter from "./routes/auth.js";
import experimentsRouter from "./routes/experiments.js";

const isProduction = process.env.NODE_ENV === "production";
const TWO_WEEKS_IN_SECONDS = 14 * 24 * 60 * 60;

const app = express();

// Vercel terminates TLS in front of the function, so the proxy headers are
// trusted to work out whether the request arrived over https.
app.set("trust proxy", 1);

app.use(express.json({ limit: "100kb" }));

app.use(
  session({
    name: "ablation.sid",
    secret: process.env.SESSION_SECRET || "ablation-development-secret",
    resave: false,
    saveUninitialized: false,
    // Serverless invocations do not share memory, so sessions live in Mongo.
    store: MongoStore.create({
      clientPromise: getClientPromise(),
      dbName: DB_NAME,
      collectionName: "sessions",
      ttl: TWO_WEEKS_IN_SECONDS,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: TWO_WEEKS_IN_SECONDS * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

app.use("/api/experiments", experimentsRouter);

// Unknown API paths answer in JSON rather than the default HTML error page.
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Unknown endpoint" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({
    error: status === 500 ? "Something went wrong on the server" : error.message,
  });
});

export default app;
