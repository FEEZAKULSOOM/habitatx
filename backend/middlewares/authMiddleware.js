import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT cookie and attach user to req.user
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    console.log('[AUTH MIDDLEWARE] Checking incoming JWT cookie...');

    if (!token) {
      console.warn('[AUTH MIDDLEWARE] Access denied: No token found in cookies');
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH MIDDLEWARE] Token verified successfully for userId:', decoded.userId);

    // Fetch user without returning password field
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.warn('[AUTH MIDDLEWARE] Access denied: User not found for token payload');
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    req.user = user;
    console.log(`[AUTH MIDDLEWARE] Authorized user: ${user.email} (Role: ${user.role})`);
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Enforce role-based access control (RBAC)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log(`[RBAC] Required roles: [${roles.join(', ')}] | User role: ${req.user?.role}`);

    if (!req.user || !roles.includes(req.user.role)) {
      console.warn(`[RBAC] Access forbidden for role: ${req.user?.role}`);
      return res.status(403).json({
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles`,
      });
    }

    next();
  };
};