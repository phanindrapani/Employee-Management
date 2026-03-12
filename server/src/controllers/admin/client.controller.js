import { Client, User } from "../../models/user.model.js";
import { uploadBufferToCloudinary } from '../../utils/cloudinaryHelper.js';

async function uploadProfilePicture(files) {
    const file = files?.profilePicture?.[0];
    if (!file) return undefined;
    return await uploadBufferToCloudinary(file, "profile_pictures");
}

const buildDefaultPassword = (name) => {
    const firstName = (name || "").trim().split(/\s+/)[0] || "Client";
    return `${firstName}123`;
};

export const getClients = async (req, res) => {
    try {
        const clients = await Client.find({ role: 'client' }).sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Client not found" });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addClient = async (req, res) => {
    try {
        const { name, email, phone, company } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists for this email" });
        }

        const profilePictureUrl = await uploadProfilePicture(req.files);
        const defaultPassword = buildDefaultPassword(name);

        const clientCode = `CLT-${Date.now().toString().slice(-6)}`;

        const newClient = await Client.create({
            name,
            email,
            password: defaultPassword,
            phone,
            company: company || '',
            clientCode,
            profilePicture: profilePictureUrl || '',
            role: 'client'
        });

        const clientObj = newClient.toObject();
        delete clientObj.password;

        res.status(201).json(clientObj);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { name, email, phone, company, isActive } = req.body;

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Client not found" });

        const profilePictureUrl = await uploadProfilePicture(req.files);

        client.name = name || client.name;
        client.email = email || client.email;
        client.phone = phone || client.phone;
        client.company = company !== undefined ? company : client.company;

        if (isActive !== undefined) {
            client.isActive = isActive === 'true' || isActive === true;
        }

        if (profilePictureUrl) {
            client.profilePicture = profilePictureUrl;
        }

        await client.save();
        res.json(client);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ message: "Client not found" });
        res.json({ message: "Client deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
