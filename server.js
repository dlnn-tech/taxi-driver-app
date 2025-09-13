const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const permitRoutes = require('./routes/permit');
const infoRoutes = require('./routes/info');
const contactRoutes = require('./routes/contact');
const { expirePermits } = require('./services/permitService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with CSP for local assets
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "data:"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/permit', permitRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/contact', contactRoutes);

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Что-то пошло не так!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Schedule automatic permit expiration check every hour
cron.schedule('0 * * * *', () => {
    console.log('Checking for expired permits...');
    expirePermits();
});

// Database sync and server start
const startServer = async () => {
    try {
        await db.authenticate();
        console.log('Database connection established successfully.');
        
        await db.sync();
        console.log('Database synchronized successfully.');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;