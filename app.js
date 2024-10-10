"use strict";

/** Express app for jobly. */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet"); // Added for security

const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const companiesRoutes = require("./routes/companies");
const usersRoutes = require("./routes/users");
const jobsRoutes = require("./routes/jobs");

const app = express();

/** Middleware setup */
app.use(helmet()); // Secure your app by setting various HTTP headers
app.use(express.json()); // Middleware for parsing JSON bodies
app.use(morgan("tiny")); // Logging middleware
app.use(authenticateJWT); // Apply JWT auth middleware globally

/** CORS configuration */
const allowedOrigins = process.env.FRONTEND_URL || "http://localhost:3000"; // Use env variable for flexibility

app.use(cors({
  origin: allowedOrigins.split(","), // Supports multiple origins if needed
  credentials: true, // Allow credentials (cookies, auth headers) in cross-origin requests
}));

/** Routes */
app.use("/auth", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/users", usersRoutes);
app.use("/jobs", jobsRoutes);

/** Root route for API status */
app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.send("API is running...");
});

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") {
    console.error(err.stack); // Log stack trace in non-test environments
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  return res.status(status).json({
    error: {
      message,
      status,
    },
  });
});

module.exports = app;
