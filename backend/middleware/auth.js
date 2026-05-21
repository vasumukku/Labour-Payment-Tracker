const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

// Only superadmin can add/edit/delete
const superAdminOnly = (req, res, next) => {
  if (req.user?.role === 'superadmin') return next();
  return res.status(403).json({ success: false, message: 'Super Admin access only.' });
};

// superadmin + adminviewer can see all data
const adminAccess = (req, res, next) => {
  if (req.user?.role === 'superadmin' || req.user?.role === 'adminviewer') return next();
  return res.status(403).json({ success: false, message: 'Admin access only.' });
};

module.exports = { protect, superAdminOnly, adminAccess };
