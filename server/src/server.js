process.env.UV_THREADPOOL_SIZE = 128;
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import os from "os";
import { initSocket } from "./socket.js";
import { createServer } from 'http';

// Load env vars immediately
const result = dotenv.config();
if (result.error) {
  console.error("ERROR: Failed to load .env file:", result.error);
} else {
  console.log(".env file loaded successfully");
}

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import adminHolidayRoutes from "./routes/admin/holiday.routes.js";
import adminRoutes from "./routes/admin/index.js";
import employeeRoutes from "./routes/employee/index.js";
import teamLeadRoutes from "./routes/team-lead/index.js";
import managerRoutes from "./routes/manager/index.js";
import notificationRoutes from "./routes/notification.routes.js";
import clientRoutes from "./routes/client/index.js";
import { checkSLABreaches } from "./jobs/slaChecker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assets (public, uploads) and .env are in the parent directory of src
const rootDir = path.join(__dirname, "..");

connectDB().then(() => {
  // Run SLA checker every hour after DB is ready
  setInterval(checkSLABreaches, 60 * 60 * 1000);
  // Run once on startup too
  checkSLABreaches();
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server tools and local scripts without Origin header.
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Middlewares
if (process.env.SILENT_LOGS !== "true") {
  app.use(morgan("dev"));
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent root
app.use(express.static(path.join(rootDir, "public")));
app.use("/uploads", express.static(path.join(rootDir, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/holidays", adminHolidayRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/team-lead", teamLeadRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/client", clientRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const getLanIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
};

const LAN_IP = getLanIP();

// 🔹 Increase connection backlog (important for load testing)
const BACKLOG = 2048;

server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.requestTimeout = 120000;
server.maxConnections = 10000;

// 🔹 Reduce connection delays under load
server.on('connection', (socket) => {
  socket.setNoDelay(true);           // Disable Nagle's algorithm
  socket.setKeepAlive(true, 60000);  // Enable TCP keepalive
});

server.listen(PORT, HOST, BACKLOG, () => {
  console.log("Server running on:");
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://${LAN_IP}:${PORT}`);
});
console.log("Server initialized and ready.");
