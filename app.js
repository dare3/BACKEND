"use strict";

/** Express app for jobly. */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const companiesRoutes = require("./routes/companies");
const usersRoutes = require("./routes/users");
const jobsRoutes = require("./routes/jobs");

const app = express();

/** CORS configuration */
app.use(cors({
  origin: "http://your-frontend-domain.com", // Update this to your actual frontend domain
  credentials: true, // Allow credentials (cookies, auth headers) in cross-origin requests
}));

app.use(express.json()); // Middleware for parsing JSON bodies
app.use(morgan("tiny")); // Logging middleware
app.use(authenticateJWT); // Apply JWT auth middleware globally

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
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
