import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  qualification: { type: String, required: true },
  documents: {
    tenth: { type: String },
    twelfth: { type: String },
    degree: { type: String },
    offerletter: { type: String },
    joiningletter: { type: String },
    resume: { type: String },
  },
  profilePicture: { type: String },
}, {
  timestamps: true,
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;