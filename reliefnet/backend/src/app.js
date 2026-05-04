const express = require("express");
const app = express();
const logger = require("./utils/logger");

const {fail} = require('./utils/apiResponse')
// Middleware

app.use(express.json());
app.use(logger)
// Routes
const userRoutes = require("./modules/users/user.routes");
const authRoutes = require('./modules/auth/auth.routes');
const roleRoutes = require('./modules/roles/role.routes')
const onboardingRoutes = require("./modules/onboarding/onboarding.routes");
const flowRoutes = require("./modules/onboarding/onboarding_flow.routes");
const executionRoutes = require("./modules/onboarding/onboarding_execution.routes");
const campaignRoutes = require("./modules/campaigns/campaigns.routes");
const sessionRoutes = require("./modules/session/session.routes");
const stepsRoutes = require("./modules/steps/steps.routes");
const beneficiaryRequestRoutes = require('./modules/beneficiary_requests/beneficiaryRequests.routes');


app.use("/users", userRoutes);
app.use('/auth', authRoutes);
app.use("/roles" , roleRoutes)
app.use("/onboarding", onboardingRoutes);
app.use("/onboarding", executionRoutes);
app.use("/onboarding-flow", flowRoutes);
app.use("/flows", flowRoutes);
app.use("/flows", executionRoutes);
app.use("/onboarding-execution", executionRoutes);
app.use("/steps", stepsRoutes);
app.use("/campaigns", campaignRoutes);
app.use('/beneficiary-requests', beneficiaryRequestRoutes);

app.use("/session", sessionRoutes);

// Health check (IMPORTANT for Step 1 testing)
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const db = require('./config/db');
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();

    res.json({
      status: "ok",
      service: "backend-running",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (dbError) {
    console.error('Database health check failed:', dbError);
    res.status(503).json({
      status: "error",
      service: "backend-running",
      database: "disconnected",
      error: dbError.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);

    // validation error special handling
    if (err.message === "Validation failed") {
        return res.status(400).json(
            fail("validationFailed", {
                message: err.message,
                details: err.details || {}
            })
        );
    }

res.status(err.statusCode || 500).json(
    fail("error", {
        message: err.message || "Internal Server Error"
    })
);
});
module.exports = app;
