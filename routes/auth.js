const express = require('express');
const rateLimit = require('express-rate-limit');
const { Driver } = require('../models');
const smsService = require('../services/smsService');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: {
        success: false,
        message: 'Слишком много попыток входа. Попробуйте позже.'
    }
});

const smsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // limit each IP to 1 SMS request per minute
    message: {
        success: false,
        message: 'Слишком частые запросы SMS. Подождите минуту.'
    }
});

// Request SMS verification code
router.post('/request-code', smsLimiter, async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Номер телефона обязателен'
            });
        }

        // Clean phone number
        const cleanPhone = smsService.cleanPhoneNumber(phone);

        // Check if driver exists
        const driver = await Driver.findOne({ where: { phone: cleanPhone } });
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Водитель с таким номером телефона не найден'
            });
        }

        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Аккаунт заблокирован. Обратитесь к администратору'
            });
        }

        // Send verification code
        const result = await smsService.sendVerificationCode(cleanPhone);

        if (result.success) {
            res.json({
                success: true,
                message: 'Код подтверждения отправлен',
                development: result.development || false
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Не удалось отправить SMS'
            });
        }

    } catch (error) {
        console.error('Request code error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Verify SMS code and login
router.post('/verify-code', authLimiter, async (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({
                success: false,
                message: 'Номер телефона и код обязательны'
            });
        }

        const cleanPhone = smsService.cleanPhoneNumber(phone);

        // Verify SMS code
        const codeResult = await smsService.verifyCode(cleanPhone, code);

        if (!codeResult.success) {
            return res.status(400).json({
                success: false,
                message: codeResult.error
            });
        }

        // Find driver
        const driver = await Driver.findOne({ where: { phone: cleanPhone } });

        if (!driver || !driver.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Водитель не найден или заблокирован'
            });
        }

        // Update last login
        await driver.update({ lastLogin: new Date() });

        // Generate JWT token
        const token = generateToken(driver.id);

        res.json({
            success: true,
            message: 'Успешная авторизация',
            token,
            driver: {
                id: driver.id,
                phone: driver.phone,
                name: driver.name,
                email: driver.email,
                carNumber: driver.carNumber,
                carModel: driver.carModel
            }
        });

    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const driver = req.driver;
        
        res.json({
            success: true,
            driver: {
                id: driver.id,
                phone: driver.phone,
                name: driver.name,
                email: driver.email,
                carNumber: driver.carNumber,
                carModel: driver.carModel,
                lastLogin: driver.lastLogin
            }
        });

    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Update driver profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const driver = req.driver;
        const { name, email, carNumber, carModel } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (carNumber) updateData.carNumber = carNumber;
        if (carModel) updateData.carModel = carModel;

        await driver.update(updateData);

        res.json({
            success: true,
            message: 'Профиль обновлён',
            driver: {
                id: driver.id,
                phone: driver.phone,
                name: driver.name,
                email: driver.email,
                carNumber: driver.carNumber,
                carModel: driver.carModel
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

module.exports = router;