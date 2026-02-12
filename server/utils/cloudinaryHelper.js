import cloudinary from '../src/config/cloudinary.js';

export const uploadBufferToCloudinary = (file, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `employee-documents/${folder}`,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );

        uploadStream.end(file.buffer);
    });
};
