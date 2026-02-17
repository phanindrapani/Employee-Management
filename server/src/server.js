import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { initSocket } from './socket.js';

// Load env vars immediately
dotenv.config();

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import adminHolidayRoutes from "./routes/admin/holiday.routes.js";
import adminRoutes from "./routes/admin/index.js";
import employeeRoutes from "./routes/employee/index.js";
import teamLeadRoutes from "./routes/team-lead/index.js";
import notificationRoutes from "./routes/notification.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assets (public, uploads) and .env are in the parent directory of src
const rootDir = path.join(__dirname, '..');

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent root
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/holidays', adminHolidayRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/team-lead', teamLeadRoutes);
app.use('/api/notifications', notificationRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
