const jwt = require('jsonwebtoken');
const { Driver } = require('../models');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Токен доступа отсутствует'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const driver = await Driver.findByPk(decoded.driverId);

        if (!driver || !driver.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Недействительный токен или водитель заблокирован'
            });
        }

        req.driver = driver;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(403).json({
            success: false,
            message: 'Недействительный токен'
        });
    }
};

const generateToken = (driverId) => {
    return jwt.sign(
        { driverId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = {
    authenticateToken,
    generateToken
};