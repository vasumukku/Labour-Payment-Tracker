const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  nameInTelugu: { type: String, trim: true, default: '' },
  role: {
    type: String,
    enum: ['superadmin', 'adminviewer', 'leader'],
    default: 'leader'
  },
  language: { type: String, enum: ['en', 'te'], default: 'en' },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.methods.comparePassword = async function(pwd) {
  return await bcrypt.compare(pwd, this.password);
};

module.exports = mongoose.model('User', userSchema);
