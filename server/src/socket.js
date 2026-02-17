import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/user.model.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // allow all origins for now, or specify your frontend URLs
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name} (${socket.user.role})`);

        // Join personal room
        socket.join(`user:${socket.user._id.toString()}`);

        // Join role-based room
        socket.join(`role:${socket.user.role}`);

        // Join team room if applicable
        if (socket.user.team) {
            socket.join(`team:${socket.user.team.toString()}`);
        }

        // Join department room if applicable
        if (socket.user.department) {
            socket.join(`dept:${socket.user.department.toString()}`);
        }

        // Global room
        socket.join('global');

        socket.on('disconnect', () => {
            // console.log('User disconnected');
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
