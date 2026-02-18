import multer from 'multer';

const ALLOWED_MIMES = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.csv', '.json', '.xlsx', '.xls', '.docx', '.pdf'];

const fileFilter = (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    const mimeOk = ALLOWED_MIMES.includes(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);

    // Require known extension; MIME can be unreliable across clients.
    if (extOk && (mimeOk || file.mimetype === 'application/octet-stream' || !file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed: CSV, JSON, XLSX, DOCX, PDF. Got: ${file.mimetype}`), false);
    }
};

const maxSizeMB = parseInt(process.env.WORKSHEET_MAX_FILE_SIZE_MB || '10', 10);

const worksheetUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 }
});

export default worksheetUpload;
