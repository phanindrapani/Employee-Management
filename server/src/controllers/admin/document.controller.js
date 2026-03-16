import EmployeeDocument from '../../models/employeeDocument.model.js';
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';
import { getIO } from '../../socket.js';

export const uploadDocument = async (req, res) => {
    try {
        const { category, documentName } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user._id;
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

        try {
            const io = getIO();
            io.to('role:admin').emit('document:uploaded', newDoc);
        } catch (e) { console.error('Socket emit error:', e); }

        res.status(201).json(newDoc);
    } catch (error) {
        console.error("Upload Document Error:", error);
        res.status(500).json({ message: "Failed to upload document" });
    }
};

export const getDocuments = async (req, res) => {
    try {
        let targetUserId = req.user._id;
        if (req.user.role === 'admin' && req.query.userId) {
            targetUserId = req.query.userId;
        }

        const documents = await EmployeeDocument.find({ user: targetUserId })
            .sort({ createdAt: -1 });

        res.json(documents);
    } catch (error) {
        console.error("Fetch Documents Error:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
    }
};

export const verifyDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await EmployeeDocument.findByIdAndUpdate(
            id,
            {
                verificationStatus: 'verified',
                verifiedBy: req.user._id,
                verifiedAt: new Date(),
                rejectionReason: null
            },
            { new: true }
        );

        if (!doc) return res.status(404).json({ message: "Document not found" });

        try {
            const io = getIO();
            const userRoom = `user:${doc.user.toString()}`;
            io.to(userRoom).emit('document:verified', doc);
            io.to('role:admin').emit('document:verified', doc);
        } catch (e) {
            console.error('Socket emit error (verifyDocument):', e);
        }

        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: "Failed to verify document" });
    }
};

export const rejectDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

        const doc = await EmployeeDocument.findByIdAndUpdate(
            id,
            {
                verificationStatus: 'rejected',
                verifiedBy: req.user._id,
                verifiedAt: new Date(),
                rejectionReason: reason
            },
            { new: true }
        );

        if (!doc) return res.status(404).json({ message: "Document not found" });

        try {
            const io = getIO();
            const userRoom = `user:${doc.user.toString()}`;
            io.to(userRoom).emit('document:rejected', doc);
            io.to('role:admin').emit('document:rejected', doc);
        } catch (e) {
            console.error('Socket emit error (rejectDocument):', e);
        }

        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: "Failed to reject document" });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await EmployeeDocument.findById(id);

        if (!doc) return res.status(404).json({ message: "Document not found" });

        if (req.user.role !== 'admin' && doc.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this document" });
        }

        await EmployeeDocument.findByIdAndDelete(id);
        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete document" });
    }
};
