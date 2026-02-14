import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // Find user but exclude password (already handled by select: false, but good to be explicit)
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User no longer exists' });
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
