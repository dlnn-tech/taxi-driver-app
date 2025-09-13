const express = require('express');
const { Driver } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const yandexTaxiService = require('../services/yandexTaxiService');

const router = express.Router();

/**
 * GET /api/driver/status
 * Get current driver status including orders enabled/disabled state
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const driverId = req.user.id;
        
        // Get driver from database
        const driver = await Driver.findByPk(driverId);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Водитель не найден'
            });
        }

        // Check Yandex Taxi status
        let ordersEnabled = false;
        let lastUpdated = null;

        try {
            const yandexStatus = await yandexTaxiService.getDriverStatus(driver.phone);
            ordersEnabled = yandexStatus.ordersEnabled || false;
            lastUpdated = new Date();
        } catch (error) {
            console.error('Failed to get Yandex Taxi status:', error);
            // In development mode, return mock status
            if (process.env.NODE_ENV === 'development') {
                ordersEnabled = Math.random() > 0.5; // Random status for demo
                lastUpdated = new Date();
            }
        }

        // Update driver status in database if needed
        if (driver.ordersEnabled !== ordersEnabled) {
            await driver.update({
                ordersEnabled,
                lastStatusCheck: lastUpdated
            });
        }

        res.json({
            success: true,
            status: {
                ordersEnabled,
                lastUpdated: lastUpdated || driver.lastStatusCheck,
                phone: driver.phone,
                name: driver.name,
                carModel: driver.carModel,
                carNumber: driver.carNumber
            }
        });

    } catch (error) {
        console.error('Get driver status error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения статуса водителя'
        });
    }
});

/**
 * POST /api/driver/toggle-orders
 * Enable/disable orders for driver
 */
router.post('/toggle-orders', authenticateToken, async (req, res) => {
    try {
        const driverId = req.user.id;
        const { enable } = req.body;
        
        // Get driver from database
        const driver = await Driver.findByPk(driverId);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Водитель не найден'
            });
        }

        // Update Yandex Taxi status
        let success = false;
        try {
            if (enable) {
                success = await yandexTaxiService.enableDriverOrders(driver.phone);
            } else {
                success = await yandexTaxiService.disableDriverOrders(driver.phone);
            }
        } catch (error) {
            console.error('Failed to update Yandex Taxi status:', error);
            // In development mode, simulate success
            if (process.env.NODE_ENV === 'development') {
                success = true;
            }
        }

        if (success) {
            // Update driver status in database
            await driver.update({
                ordersEnabled: enable,
                lastStatusCheck: new Date()
            });

            res.json({
                success: true,
                message: enable ? 'Заказы включены' : 'Заказы отключены',
                status: {
                    ordersEnabled: enable,
                    lastUpdated: new Date()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Ошибка обновления статуса заказов'
            });
        }

    } catch (error) {
        console.error('Toggle orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка изменения статуса заказов'
        });
    }
});

module.exports = router;