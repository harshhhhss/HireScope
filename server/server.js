// Load environment variables from server/.env before anything else reads them.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const validateEnv = require('./config/validateEnv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');

// Check the environment before anything tries to use it. This exits the
// process if a required variable is missing, so nothing below runs half-set-up.
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Where the browser client is served from.
 *
 * A comma-separated list, because a real deploy has more than one: a Vercel
 * production domain plus its preview domains. Falls back to the local dev
 * server so a fresh clone works with no configuration.
 */
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Render (and most hosts) put a proxy in front of the app. Without this,
// req.ip is the proxy's address, every visitor shares one rate limit bucket,
// and the limiter is worse than useless. `1` trusts exactly one hop - `true`
// would let a client spoof X-Forwarded-For and skip the limit entirely.
app.set('trust proxy', 1);

// ---- Middleware ----

// Standard security headers. Defaults are the right choice for a JSON API.
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header means a same-origin request, curl, or a health check
      // from the platform. Those are not browser cross-origin requests, so
      // there is nothing to protect against by blocking them.
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);

// The largest legitimate body is two 25,000-character fields (resume_text and
// job_description, both capped in resumeController). That is roughly 50KB of
// text, more once UTF-8 multibyte characters and JSON escaping are counted -
// uncomfortably close to Express's 100kb default. 256kb leaves real headroom
// without accepting anything a resume checker has any business receiving.
// File uploads do not pass through here; multer caps those separately at 5MB.
app.use(express.json({ limit: '256kb' }));

// ---- Routes ----
app.use('/api/v1', apiRoutes);

// A tiny health check, handy for confirming the server is up.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hirescope-api' });
});

// Anything that reached here matched no route above.
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Express error handler: four arguments is what marks it as one.
app.use((err, req, res, next) => {
  // A blocked origin is a configuration mismatch, not a server fault, and
  // saying so beats a generic 500 that looks like the API is broken.
  if (err && /not allowed by CORS/.test(err.message)) {
    return res.status(403).json({
      success: false,
      error: `${err.message}. Set CLIENT_ORIGIN in server/.env to include it.`,
    });
  }

  // express.json rejects an oversized body with entity.too.large.
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request body is too large. Resumes and job descriptions are capped at 25,000 characters each.',
    });
  }

  // ...and malformed JSON with a SyntaxError carrying status 400.
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Request body is not valid JSON.' });
  }

  // Anything else that already carries a 4xx knows what it is: the client sent
  // something wrong, so pass that through rather than relabelling it a server
  // fault. Only genuine 5xx get masked, because those may leak internals.
  const status = err?.status ?? err?.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ success: false, error: err.message });
  }

  console.error(err.stack);
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

// ---- Start ----
// Connect to MongoDB first, then start listening, so the API is never up
// without a database behind it.
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`HireScope API listening on http://localhost:${PORT}`);
    console.log(`ML service expected at ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}`);
    console.log(`Accepting browser requests from: ${ALLOWED_ORIGINS.join(', ')}`);
  });

  /**
   * Shut down cleanly.
   *
   * Render sends SIGTERM on every redeploy. Without this the process is killed
   * mid-request and Mongo is left to time the connection out on its own; with
   * it, in-flight requests finish and the connection is closed deliberately.
   */
  async function shutdown(signal) {
    console.log(`\n${signal} received - shutting down.`);

    // Stop accepting new connections, then wait for in-flight ones to finish.
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed. Goodbye.');
        process.exit(0);
      } catch (error) {
        console.error(`Error closing MongoDB: ${error.message}`);
        process.exit(1);
      }
    });

    // A keep-alive socket can hold the server open indefinitely. Render will
    // SIGKILL us eventually anyway, so exit on our own terms first.
    setTimeout(() => {
      console.error('Shutdown timed out after 10s - forcing exit.');
      process.exit(1);
    }, 10000).unref();
  }

  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });
});
