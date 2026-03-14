import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Simple in-memory cache for user lookups to reduce DB load under high concurrency
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
            } else {
                // Optimized user lookup: use .lean() and select specific fields
                const user = await User.findById(decoded.id)
                    .select('name email role isActive department team reportingManager')
                    .lean();
                
                if (user) {
                    userCache.set(decoded.id, { data: user, timestamp: Date.now() });
                    req.user = user;
                } else {
                    return res.status(401).json({ message: 'User no longer exists' });
                }
            }

            if (!req.user.isActive) {
                return res.status(401).json({ message: 'User account is deactivated' });
            }

            next();
        } catch (error) {
            console.error('JWT Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token invalid or expired' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Centralized Role Authorization
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

// Legacy shorthand for backward compatibility if needed (can be refactored later)
export const admin = authorizeRole(['admin']);
