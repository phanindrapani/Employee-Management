import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import fs from 'fs';
import path from 'path';

const logFile = path.resolve('auth_debug.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
};

const userCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // Check cache first
            const cachedUser = userCache.get(decoded.id);
            if (cachedUser && (Date.now() - cachedUser.timestamp < CACHE_TTL)) {
                req.user = cachedUser.data;
                req.user.id = req.user._id.toString();
            } else {
                const user = await User.findById(decoded.id);
                if (user) {
                    user.id = user._id.toString();
                    userCache.set(decoded.id, { data: user, timestamp: Date.now() });
                    req.user = user;
                } else {
                    log(`Authentication failed: User not found for ID ${decoded.id}`);
                    return res.status(401).json({ message: 'User no longer exists' });
                }
            }

            if (!req.user.isActive) {
                log(`Authentication failed: User account deactivated ${decoded.id}`);
                return res.status(401).json({ message: 'User account is deactivated' });
            }

            log(`Authentication success: User ${req.user.email} (${req.user.role}) for ${req.method} ${req.originalUrl}`);
            next();
        } catch (error) {
            log(`JWT Error in protect: ${error.message} (token: ${token ? token.substring(0, 10) : 'none'})`);
            res.status(401).json({ message: 'Not authorized, token invalid or expired' });
        }
    }

    if (!token) {
        log(`Authentication failed: No token provided for ${req.method} ${req.originalUrl}`);
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && allowedRoles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({
                message: `User role '${req.user?.role}' is not authorized to access this route`
            });
        }
    };
};

export const admin = authorizeRole(['admin']);
