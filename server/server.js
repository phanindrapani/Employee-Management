import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from "./src/config/db.js";
import { notFound, errorHandler } from "./error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import holidayRoutes from "./routes/holiday.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import employeeRoutes from "./src/routes/employee.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
import documentRoutes from "./routes/employeeDocument.routes.js";
app.use('/api/documents', documentRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
