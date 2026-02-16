import mongoose from 'mongoose';

const globalSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

const GlobalSetting = mongoose.model('GlobalSetting', globalSettingSchema);
export default GlobalSetting;
