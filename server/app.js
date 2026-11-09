import express from "express";

const app = express();

// Vercel terminates TLS in front of the function, so the proxy headers are
// trusted to work out whether the request arrived over https.
app.set("trust proxy", 1);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

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
