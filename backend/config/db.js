const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    await createDefaultAdmin();
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const existing = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (!existing) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'LabourAdmin@2024', 12);
      await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashed,
        name: 'Super Admin',
        role: 'superadmin',
        isActive: true,
      });
      console.log('✅ Default superadmin created');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'LabourAdmin@2024'}`);
    } else if (existing.role !== 'superadmin') {
      // Fix existing admin role
      await User.findByIdAndUpdate(existing._id, { role: 'superadmin' });
      console.log('✅ Admin role updated to superadmin');
    }
  } catch (err) {
    console.error('Warning:', err.message);
  }
};

module.exports = connectDB;
