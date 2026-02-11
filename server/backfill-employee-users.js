import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import Employee from "./src/models/employee.model.js";
import User from "./models/user.model.js";

dotenv.config();
connectDB();

const buildDefaultPassword = (name) => {
  const firstName = (name || "").trim().split(/\s+/)[0] || "Employee";
  return `${firstName}123`;
};

const backfillEmployeeUsers = async () => {
  try {
    const employees = await Employee.find({});
    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      const existingUser = await User.findOne({ email: employee.email });
      if (existingUser) {
        skipped += 1;
        continue;
      }

      await User.create({
        name: employee.name,
        email: employee.email,
        password: buildDefaultPassword(employee.name),
        role: "employee",
        phone: employee.phone
      });

      created += 1;
    }

    console.log(`Backfill complete. Created: ${created}, Skipped: ${skipped}`);
    process.exit();
  } catch (error) {
    console.error(`Backfill failed: ${error.message}`);
    process.exit(1);
  }
};

backfillEmployeeUsers();
