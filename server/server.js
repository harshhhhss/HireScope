// Load environment variables from server/.env before anything else reads them.
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors());            // allow the React client on another port to call us
app.use(express.json());    // parse JSON request bodies into req.body

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
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ---- Start ----
// Connect to MongoDB first, then start listening, so the API is never up
// without a database behind it.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`HireScope API listening on http://localhost:${PORT}`);
    console.log(`ML service expected at ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}`);
  });
});
