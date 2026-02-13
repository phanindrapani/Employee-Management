import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadDocuments = upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'tenthMarksheet', maxCount: 1 },
    { name: 'intermediateMarksheet', maxCount: 1 },
    { name: 'graduationCertificate', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 },
    { name: 'joiningLetter', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]);
