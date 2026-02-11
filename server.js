import connectDB from "./src/config/db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { notFound, errorHandler } from "./error.middleware.js";
import employeeRoutes from "./src/routes/employee.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend assets from project root and uploaded documents.
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use("/api/employees", employeeRoutes);
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
