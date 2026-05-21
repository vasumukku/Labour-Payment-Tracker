require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'http://localhost:3000',
    /\.vercel\.app$/,
    /\.netlify\.app$/,
    /\.onrender\.com$/,
  ],
  credentials: true,
}));

app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20 }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => res.json({ success: true, message: '✅ Labour Tracker API running!', db: 'labour_tracker' }));
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: 'Server error' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Labour Tracker API running on port ${PORT}`);
});
