const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, superAdminOnly } = require('../middleware/auth');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// Login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const user = await User.findOne({ username: req.body.username.toLowerCase().trim() });
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid username or password' });
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid username or password' });
    res.json({
      success: true,
      token: genToken(user._id),
      user: {
        id: user._id, username: user.username, name: user.name,
        nameInTelugu: user.nameInTelugu, role: user.role,
        language: user.language, theme: user.theme,
      },
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id, username: req.user.username, name: req.user.name,
      nameInTelugu: req.user.nameInTelugu, role: req.user.role,
      language: req.user.language, theme: req.user.theme,
    }
  });
});

// Update preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const { language, theme } = req.body;
    const updates = {};
    if (language && ['en', 'te'].includes(language)) updates.language = language;
    if (theme && ['light', 'dark'].includes(theme)) updates.theme = theme;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id, username: user.username, name: user.name,
        nameInTelugu: user.nameInTelugu, role: user.role,
        language: user.language, theme: user.theme,
      }
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Update password — superadmin only
router.put('/password', protect, superAdminOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    const user = await User.findById(req.user._id);
    if (!await user.comparePassword(currentPassword)) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── GET all leaders — superadmin + adminviewer can see
router.get('/leaders', protect, async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'superadmin' && role !== 'adminviewer') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const leaders = await User.find({ role: 'leader' }).select('-password').sort({ name: 1 });
    res.json({ success: true, leaders });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── CREATE leader — superadmin only
router.post('/leaders', protect, superAdminOnly, [
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username min 3 chars'),
  body('password').notEmpty().isLength({ min: 4 }).withMessage('Password min 4 chars'),
  body('name').trim().notEmpty().withMessage('Name required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const existing = await User.findOne({ username: req.body.username.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });
    const hashed = await bcrypt.hash(req.body.password, 12);
    const leader = await User.create({
      username: req.body.username.toLowerCase().trim(),
      password: hashed,
      name: req.body.name.trim(),
      nameInTelugu: req.body.nameInTelugu?.trim() || '',
      role: 'leader',
    });
    res.status(201).json({ success: true, leader: { id: leader._id, username: leader.username, name: leader.name, nameInTelugu: leader.nameInTelugu } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── UPDATE leader — superadmin only
router.put('/leaders/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, nameInTelugu, isActive, password } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (nameInTelugu !== undefined) updates.nameInTelugu = nameInTelugu.trim();
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (password && password.length >= 4) updates.password = await bcrypt.hash(password, 12);
    const leader = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!leader) return res.status(404).json({ success: false, message: 'Leader not found' });
    res.json({ success: true, leader });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── DELETE leader — superadmin only
router.delete('/leaders/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Leader deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── GET all viewers (adminviewer accounts) — superadmin only
router.get('/viewers', protect, superAdminOnly, async (req, res) => {
  try {
    const viewers = await User.find({ role: 'adminviewer' }).select('-password').sort({ name: 1 });
    res.json({ success: true, viewers });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── CREATE adminviewer — superadmin only
router.post('/viewers', protect, superAdminOnly, [
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username min 3 chars'),
  body('password').notEmpty().isLength({ min: 4 }).withMessage('Password min 4 chars'),
  body('name').trim().notEmpty().withMessage('Name required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const existing = await User.findOne({ username: req.body.username.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });
    const hashed = await bcrypt.hash(req.body.password, 12);
    const viewer = await User.create({
      username: req.body.username.toLowerCase().trim(),
      password: hashed,
      name: req.body.name.trim(),
      role: 'adminviewer',
    });
    res.status(201).json({ success: true, viewer: { id: viewer._id, username: viewer.username, name: viewer.name, role: viewer.role } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── UPDATE viewer — superadmin only
router.put('/viewers/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, isActive, password } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (password && password.length >= 4) updates.password = await bcrypt.hash(password, 12);
    const viewer = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!viewer) return res.status(404).json({ success: false, message: 'Viewer not found' });
    res.json({ success: true, viewer });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── DELETE viewer — superadmin only
router.delete('/viewers/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Viewer deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
