import EmployeeDocument from '../../models/employeeDocument.model.js';
import Notification from '../../models/notification.model.js';
import User from '../../models/user.model.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import { getIO } from '../../socket.js';

// Upload a document
export const uploadDocument = async (req, res) => {
    try {
        const { category, documentName } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user._id;
        // Use username or id for folder organization in cloudinary if needed
        const folder = `documents/${userId}`;

        const fileUrl = await uploadBufferToCloudinary(req.file, folder);

        const newDoc = await EmployeeDocument.create({
            user: userId,
            category,
            documentName,
            fileUrl,
            originalName: req.file.originalname,
            verificationStatus: 'pending'
        });

        res.status(201).json(newDoc);

        // --- NOTIFICATION LOGIC ---
        try {
            // 1. Find all Admins
            const admins = await User.find({ role: 'admin' });

            // 2. Create Notification for each Admin
            const notifications = admins.map(admin => ({
                user: admin._id,
                message: `📄 New Document Uploaded: ${req.user.name} uploaded "${documentName}" (${category})`,
                isRead: false
            }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);

                // 3. Send Real-time Socket Alert to Admin Room
                const io = getIO();
                io.to('role:admin').emit('notification', {
                    message: `📄 New Document: ${req.user.name} uploaded "${documentName}"`,
                    type: 'document_upload',
                    documentId: newDoc._id,
                    user: req.user.name
                });
            }
        } catch (notifError) {
            console.error("Notification Error:", notifError);
            // Don't fail the upload if notification fails
        }
    } catch (error) {
        console.error("Upload Document Error:", error);
        res.status(500).json({ message: "Failed to upload document" });
    }
};

// Get documents for the logged-in user
export const getDocuments = async (req, res) => {
    try {
        let targetUserId = req.user._id;

        const documents = await EmployeeDocument.find({ user: targetUserId })
            .sort({ createdAt: -1 });

        res.json(documents);
    } catch (error) {
        console.error("Fetch Documents Error:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
    }
};

// Delete a document (Employee can delete own pending/rejected)
export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await EmployeeDocument.findById(id);

        if (!doc) return res.status(404).json({ message: "Document not found" });

        // Authorization check
        if (doc.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this document" });
        }

        // Only allow deleting if not verified
        if (doc.verificationStatus === 'verified') {
            return res.status(400).json({ message: "Cannot delete verified documents" });
        }

        await EmployeeDocument.findByIdAndDelete(id);
        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete document" });
    }
};
