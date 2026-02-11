import connectDB  from "./src/config/db.js";  
import express from "express";  
import cors from "cors";  
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from "./error.middleware.js";
import employeeRoutes from "./src/routes/employee.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.use('/api/employees', employeeRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));