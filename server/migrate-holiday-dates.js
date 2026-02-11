import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import Holiday from "./models/holiday.model.js";

dotenv.config();
connectDB();

const parseDateOnly = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
};

const normalizeToLocalDate = (value) => {
  const d = parseDateOnly(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const migrate = async () => {
  try {
    const holidays = await Holiday.find({});
    let updated = 0;
    let unchanged = 0;

    for (const holiday of holidays) {
      const normalized = normalizeToLocalDate(holiday.date);
      if (holiday.date.getTime() !== normalized.getTime()) {
        holiday.date = normalized;
        await holiday.save();
        updated += 1;
      } else {
        unchanged += 1;
      }
    }

    console.log(`Holiday migration complete. Updated: ${updated}, Unchanged: ${unchanged}`);
    process.exit();
  } catch (error) {
    console.error(`Holiday migration failed: ${error.message}`);
    process.exit(1);
  }
};

migrate();
