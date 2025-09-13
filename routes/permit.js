const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const permitService = require('../services/permitService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 4 // Maximum 4 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_PHOTO_TYPES || 'image/jpeg,image/jpg,image/png').split(',');
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только файлы форматов JPG, JPEG, PNG'), false);
        }
    }
});

// Get current permit status
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const driverId = req.driver.id;
        
        // Check for active permit first
        const activeResult = await permitService.getCurrentPermit(driverId);
        if (activeResult.success && activeResult.permit) {
            return res.json({
                success: true,
                permit: activeResult.permit,
                status: 'active'
            });
        }

        // Get or create pending permit
        const pendingResult = await permitService.getOrCreatePendingPermit(driverId);
        if (pendingResult.success) {
            res.json({
                success: true,
                permit: pendingResult.permit,
                status: 'pending'
            });
        } else {
            res.status(500).json({
                success: false,
                message: pendingResult.error
            });
        }

    } catch (error) {
        console.error('Get current permit error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Update checklist
router.post('/checklist', authenticateToken, async (req, res) => {
    try {
        const driverId = req.driver.id;
        const checklistData = req.body;

        // Get pending permit
        const permitResult = await permitService.getOrCreatePendingPermit(driverId);
        if (!permitResult.success) {
            return res.status(500).json({
                success: false,
                message: permitResult.error
            });
        }

        // Update checklist
        const updateResult = await permitService.updateChecklist(
            permitResult.permit.id,
            checklistData
        );

        if (updateResult.success) {
            res.json({
                success: true,
                message: 'Чек-лист обновлён',
                checklist: updateResult.checklist
            });
        } else {
            res.status(400).json({
                success: false,
                message: updateResult.error
            });
        }

    } catch (error) {
        console.error('Update checklist error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Upload photos
router.post('/photos', authenticateToken, upload.fields([
    { name: 'waybill_1', maxCount: 1 },
    { name: 'waybill_2', maxCount: 1 },
    { name: 'car_exterior', maxCount: 1 },
    { name: 'car_interior', maxCount: 1 }
]), async (req, res) => {
    try {
        const driverId = req.driver.id;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Файлы не загружены'
            });
        }

        // Get pending permit
        const permitResult = await permitService.getOrCreatePendingPermit(driverId);
        if (!permitResult.success) {
            return res.status(500).json({
                success: false,
                message: permitResult.error
            });
        }

        // Upload photos
        const uploadResult = await permitService.uploadPhotos(
            permitResult.permit.id,
            req.files
        );

        if (uploadResult.success) {
            res.json({
                success: true,
                message: 'Фотографии загружены',
                uploadResults: uploadResult.uploadResults,
                photos: uploadResult.savedPhotos
            });
        } else {
            res.status(400).json({
                success: false,
                message: uploadResult.error
            });
        }

    } catch (error) {
        console.error('Upload photos error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Submit permit for approval
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const driverId = req.driver.id;

        // Get pending permit
        const permitResult = await permitService.getOrCreatePendingPermit(driverId);
        if (!permitResult.success) {
            return res.status(500).json({
                success: false,
                message: permitResult.error
            });
        }

        // Submit permit
        const submitResult = await permitService.submitPermit(permitResult.permit.id);

        if (submitResult.success) {
            res.json({
                success: true,
                message: submitResult.message,
                permit: submitResult.permit
            });
        } else {
            res.status(400).json({
                success: false,
                message: submitResult.error
            });
        }

    } catch (error) {
        console.error('Submit permit error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Get permit history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const driverId = req.driver.id;
        const limit = parseInt(req.query.limit) || 10;

        const historyResult = await permitService.getPermitHistory(driverId, limit);

        if (historyResult.success) {
            res.json({
                success: true,
                permits: historyResult.permits
            });
        } else {
            res.status(500).json({
                success: false,
                message: historyResult.error
            });
        }

    } catch (error) {
        console.error('Get permit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Check if permit is ready for submission
router.get('/ready', authenticateToken, async (req, res) => {
    try {
        const driverId = req.driver.id;

        // Get pending permit
        const permitResult = await permitService.getOrCreatePendingPermit(driverId);
        if (!permitResult.success) {
            return res.status(500).json({
                success: false,
                message: permitResult.error
            });
        }

        const isReady = permitService.isPermitReady(permitResult.permit);

        res.json({
            success: true,
            ready: isReady,
            permit: permitResult.permit
        });

    } catch (error) {
        console.error('Check permit ready error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

module.exports = router;