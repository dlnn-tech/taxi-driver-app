const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Simple test endpoint - no database required
router.post('/test-login', (req, res) => {
    const { phone, code } = req.body;
    
    console.log('[SIMPLE AUTH] Test login attempt:', { phone, code });
    
    // Check test credentials
    if (phone === '+79991234567' && code === '1234') {
        // Generate simple token
        const token = jwt.sign(
            { driverId: 1, phone },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: 'Test login successful',
            token,
            driver: {
                id: 1,
                phone: '+79991234567',
                name: 'Демо Водитель',
                carModel: 'Hyundai Solaris',
                carNumber: 'А123БВ77'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid test credentials'
        });
    }
});

// Simple SMS request endpoint - no database required
router.post('/test-sms', (req, res) => {
    const { phone } = req.body;
    
    console.log('[SIMPLE AUTH] Test SMS request for:', phone);
    
    if (phone === '+79991234567' || phone === '79991234567') {
        res.json({
            success: true,
            message: 'Test SMS sent',
            development: true,
            testCode: '1234'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Only test phone +79991234567 is supported'
        });
    }
});

module.exports = router;