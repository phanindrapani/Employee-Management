import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import User from './models/user.model.js';
import EmployeeDocument from './models/employeeDocument.model.js';

dotenv.config();

const seedDocuments = async () => {
    try {
        await connectDB();

        console.log('🧹 Clearing existing documents...');
        await EmployeeDocument.deleteMany({});

        console.log('🔍 Finding employees...');
        const employees = await User.find({ role: { $ne: 'admin' } });

        if (employees.length === 0) {
            console.log('⚠️ No employees found! Run "npm run seed" first.');
            process.exit(1);
        }

        const documents = [];
        const categories = ['identity', 'education', 'employment', 'other'];
        const sampleDocs = [
            { name: 'Aadhar Card', url: 'https://res.cloudinary.com/demo/image/upload/v1631557920/sample.jpg' },
            { name: 'PAN Card', url: 'https://res.cloudinary.com/demo/image/upload/v1631557920/sample.jpg' },
            { name: '10th Marksheet', url: 'https://res.cloudinary.com/demo/image/upload/v1631557920/sample_pdf.pdf' },
            { name: '12th Marksheet', url: 'https://res.cloudinary.com/demo/image/upload/v1631557920/sample_pdf.pdf' },
            { name: 'Offer Letter', url: 'https://res.cloudinary.com/demo/image/upload/v1631557920/sample.jpg' },
            { name: 'Resume', url: 'https://res.cloudinary.com/demo/image/upload/v1631557920/sample.jpg' }
        ];

        console.log('🌱 Creating dummy documents for employees...');

        for (const emp of employees) {
            // Give each employee 2-3 random documents
            const numDocs = Math.floor(Math.random() * 2) + 2;

            for (let i = 0; i < numDocs; i++) {
                const randomDoc = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
                const randomCategory = categories[Math.floor(Math.random() * categories.length)];

                // Randomly set some as verified, rejected, or pending
                const statuses = ['pending', 'verified', 'rejected'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                documents.push({
                    user: emp._id,
                    category: randomCategory,
                    documentName: randomDoc.name,
                    fileUrl: randomDoc.url,
                    originalName: `sample_${randomCategory}_${i}.jpg`,
                    verificationStatus: status,
                    rejectionReason: status === 'rejected' ? 'Image details not clear' : undefined,
                    verifiedAt: status !== 'pending' ? new Date() : undefined,
                });
            }
        }

        await EmployeeDocument.insertMany(documents);
        console.log(`✅ Successfully seeded ${documents.length} documents for ${employees.length} employees!`);

        process.exit();
    } catch (error) {
        console.error(`❌ Error seeding documents: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
};

seedDocuments();
