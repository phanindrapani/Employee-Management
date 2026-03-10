import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs and DOCX are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadDocuments = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'tenth', maxCount: 1 },
    { name: 'twelfth', maxCount: 1 },
    { name: 'degree', maxCount: 1 },
    { name: 'offerletter', maxCount: 1 },
    { name: 'joiningletter', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]);

export const uploadAttachments = upload.array('attachments', 5); // Allow up to 5 attachments

export { upload };
export default upload;
