import EmployeeDocument from '../../models/employeeDocument.model.js';
import Notification from '../../models/notification.model.js';
import User from '../../models/user.model.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../utils/cloudinaryHelper.js';
import { getIO } from '../../socket.js';

export const uploadDocument = async (req, res) => {
    try {
        const { category, documentName } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user._id;
        const folder = `documents/${userId}`;

        const { secure_url, public_id } = await uploadBufferToCloudinary(req.file, folder);

        const newDoc = await EmployeeDocument.create({
            user: userId,
            category,
            documentName,
            fileUrl: secure_url,
            publicId: public_id,
            originalName: req.file.originalname,
            verificationStatus: 'pending'
        });

        res.status(201).json(newDoc);

        // Offload notification logic to avoid blocking the user's response
        setImmediate(async () => {
            try {
                const admins = await User.find({ role: 'admin' }).select('_id').lean();

                const notifications = admins.map(admin => ({
                    user: admin._id,
                    message: `New Document Uploaded: ${req.user.name} uploaded "${documentName}" (${category})`,
                    isRead: false
                }));

                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);

                    const io = getIO();
                    io.to('role:admin').emit('notification', {
                        message: `New Document: ${req.user.name} uploaded "${documentName}"`,
                        type: 'document_upload',
                        documentId: newDoc._id,
                        user: req.user.name
                    });

                    io.to('role:admin').emit('document:uploaded', newDoc);
                }
            } catch (notifError) {
                console.error("Notification Error (Async):", notifError);
            }
        });
    } catch (error) {
        console.error("Upload Document Error:", error);
        res.status(500).json({ message: "Failed to upload document" });
    }
};

export const getDocuments = async (req, res) => {
    try {
        let targetUserId = req.user._id;

        const documents = await EmployeeDocument.find({ user: targetUserId })
            .sort({ createdAt: -1 })
            .lean();

        res.json(documents);
    } catch (error) {
        console.error("Fetch Documents Error:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await EmployeeDocument.findById(id);

        if (!doc) return res.status(404).json({ message: "Document not found" });

        if (doc.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this document" });
        }
        if (doc.verificationStatus === 'verified') {
            return res.status(400).json({ message: "Cannot delete verified documents" });
        }

        // Delete from Cloudinary
        if (doc.publicId) {
            await deleteFromCloudinary(doc.publicId);
        }

        await EmployeeDocument.findByIdAndDelete(id);

        try {
            const io = getIO();
            io.to('role:admin').emit('document:deleted', { id: id });
        } catch (e) {
            console.error('Socket emit error (deleteDocument):', e);
        }

        res.json({ message: "Document deleted successfully both from database and Cloudinary" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete document" });
    }
};
