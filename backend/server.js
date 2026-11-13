const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const alertRouter = require("./routes/alert.routes");
const roomRouter = require("./routes/room.routes");
const bilikRouter = require("./routes/bilik.routes");
const sensorRouter = require("./routes/sensor.routes");
const actuatorRouter = require("./routes/actuator.routes");
const auditLogRouter = require("./routes/auditLog.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Restrict CORS to known front-end origins instead of reflecting any origin.
// Set CORS_ORIGINS in .env (comma-separated) for staging/production domains.
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:8081,http://localhost:19006,http://localhost:19000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, mobile apps) that send no Origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api", alertRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bilik", bilikRouter);
app.use("/api", sensorRouter);
app.use("/api", actuatorRouter);
app.use("/api/audit-logs", auditLogRouter);

app.listen(PORT, () => {
  console.log(`FireBomba backend running on port ${PORT}`);
});
