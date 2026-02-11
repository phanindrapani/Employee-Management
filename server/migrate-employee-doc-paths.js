import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import connectDB from "./src/config/db.js";
import Employee from "./src/models/employee.model.js";

dotenv.config();
connectDB();

const docKeys = ["tenth", "twelfth", "degree", "offerletter", "joiningletter", "resume"];
const uploadsRoot = path.join(process.cwd(), "uploads");

const normalizePath = (value) => {
  if (!value) return value;
  const normalized = value.replace(/\\/g, "/");
  const idx = normalized.indexOf("uploads/");
  if (idx >= 0) {
    return normalized.slice(idx);
  }
  return normalized.replace(/^\/+/, "");
};

const fileExists = (relativePath) => {
  if (!relativePath) return false;
  const diskPath = path.join(process.cwd(), relativePath.replace(/\//g, path.sep));
  return fs.existsSync(diskPath);
};

const migrate = async () => {
  try {
    const employees = await Employee.find({});
    let updated = 0;
    let untouched = 0;
    const missingFiles = [];

    for (const employee of employees) {
      let changed = false;
      const docs = { ...(employee.documents || {}) };

      for (const key of docKeys) {
        const current = docs[key];
        if (!current) continue;
        const normalized = normalizePath(current);
        if (normalized !== current) {
          docs[key] = normalized;
          changed = true;
        }

        if (normalized && !fileExists(normalized)) {
          missingFiles.push({ employeeId: employee._id.toString(), key, path: normalized });
        }
      }

      if (changed) {
        employee.documents = docs;
        await employee.save();
        updated += 1;
      } else {
        untouched += 1;
      }
    }

    console.log(`Migration complete. Updated: ${updated}, Unchanged: ${untouched}`);
    if (missingFiles.length > 0) {
      console.log("Missing files:");
      for (const item of missingFiles) {
        console.log(`- ${item.employeeId} ${item.key}: ${item.path}`);
      }
    } else {
      console.log("No missing files detected.");
    }

    process.exit();
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

migrate();
