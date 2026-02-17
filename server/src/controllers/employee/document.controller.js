import EmployeeDocument from '../../models/employeeDocument.model.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';

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
