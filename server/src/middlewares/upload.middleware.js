import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    switch (file.fieldname) {
      case "tenth":
        uploadPath = "uploads/10th";
        break;
      case "twelfth":
        uploadPath = "uploads/12th";
        break;
      case "degree":
        uploadPath = "uploads/degree";
        break;
      case "offerletter":
        uploadPath = "uploads/offerletter";
        break;
      case "joiningletter":
        uploadPath = "uploads/joiningletter";
        break;
      case "resume":
        uploadPath = "uploads/resume";
        break;
      default:
        return cb(new Error(`Invalid field name for file upload: ${file.fieldname}`));
    }

    // Ensure the directory exists before uploading
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

export default upload;
