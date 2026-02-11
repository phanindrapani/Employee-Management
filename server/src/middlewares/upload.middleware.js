import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadBase = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    switch (file.fieldname) {
      case "tenth":
        uploadPath = path.join(uploadBase, "10th");
        break;
      case "twelfth":
        uploadPath = path.join(uploadBase, "12th");
        break;
      case "degree":
        uploadPath = path.join(uploadBase, "degree");
        break;
      case "offerletter":
        uploadPath = path.join(uploadBase, "offerletter");
        break;
      case "joiningletter":
        uploadPath = path.join(uploadBase, "joiningletter");
        break;
      case "resume":
        uploadPath = path.join(uploadBase, "resume");
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
