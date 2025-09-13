const { Permit, Photo, Driver } = require('../models');
const yandexTaxiService = require('./yandexTaxiService');
const storageService = require('./storageService');
const { Op } = require('sequelize');

class PermitService {
    constructor() {
        this.PERMIT_DURATION_HOURS = 16;
    }

    /**
     * Get current active permit for driver
     */
    async getCurrentPermit(driverId) {
        try {
            const permit = await Permit.findOne({
                where: {
                    driverId,
                    status: 'active',
                    expiresAt: {
                        [Op.gt]: new Date()
                    }
                },
                include: [{
                    model: Photo,
                    as: 'photos'
                }]
            });

            return { success: true, permit };
        } catch (error) {
            console.error('Get current permit error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get or create pending permit for driver
     */
    async getOrCreatePendingPermit(driverId) {
        try {
            // Check if there's already a pending permit
            let permit = await Permit.findOne({
                where: {
                    driverId,
                    status: 'pending'
                },
                include: [{
                    model: Photo,
                    as: 'photos'
                }]
            });

            // If no pending permit, create one
            if (!permit) {
                permit = await Permit.create({
                    driverId,
                    status: 'pending'
                });
                
                // Reload with associations
                permit = await Permit.findByPk(permit.id, {
                    include: [{
                        model: Photo,
                        as: 'photos'
                    }]
                });
            }

            return { success: true, permit };
        } catch (error) {
            console.error('Get or create pending permit error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update checklist for permit
     */
    async updateChecklist(permitId, checklistData) {
        try {
            const permit = await Permit.findByPk(permitId);
            
            if (!permit) {
                return { success: false, error: 'Допуск не найден' };
            }

            if (permit.status !== 'pending') {
                return { success: false, error: 'Можно обновлять только ожидающие допуски' };
            }

            // Update checklist
            const updatedChecklist = {
                ...permit.checklist,
                ...checklistData
            };

            await permit.update({ checklist: updatedChecklist });

            return { success: true, checklist: updatedChecklist };
        } catch (error) {
            console.error('Update checklist error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Upload photos for permit
     */
    async uploadPhotos(permitId, files) {
        try {
            const permit = await Permit.findByPk(permitId);
            
            if (!permit) {
                return { success: false, error: 'Допуск не найден' };
            }

            if (permit.status !== 'pending') {
                return { success: false, error: 'Можно загружать фото только для ожидающих допусков' };
            }

            // Delete existing photos for this permit
            const existingPhotos = await Photo.findAll({ where: { permitId } });
            for (const photo of existingPhotos) {
                await storageService.deletePhoto(photo.filename);
                await photo.destroy();
            }

            // Upload new photos
            const uploadResults = await storageService.uploadMultiplePhotos(
                files,
                permit.driverId,
                permitId
            );

            // Save successful uploads to database
            const savedPhotos = [];
            for (const result of uploadResults) {
                if (result.success) {
                    const photo = await Photo.create({
                        permitId,
                        type: result.type,
                        filename: result.filename,
                        originalName: files[result.type][0].originalname,
                        mimeType: files[result.type][0].mimetype,
                        size: files[result.type][0].size,
                        url: result.url
                    });
                    savedPhotos.push(photo);
                }
            }

            return {
                success: true,
                uploadResults,
                savedPhotos
            };

        } catch (error) {
            console.error('Upload photos error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if permit is ready for approval
     */
    isPermitReady(permit) {
        if (!permit.checklist) return false;

        // Check if all checklist items are completed
        const requiredItems = [
            'plafon', 'carWrapped', 'businessCard', 'dashcam',
            'firstAidKit', 'tireCondition', 'lights', 'taximeter', 'medicalCheck'
        ];

        const allItemsChecked = requiredItems.every(item => permit.checklist[item] === true);

        // Check if all required photos are uploaded
        const requiredPhotoTypes = ['waybill_1', 'waybill_2', 'car_exterior', 'car_interior'];
        const uploadedPhotoTypes = permit.photos.map(photo => photo.type);
        const allPhotosUploaded = requiredPhotoTypes.every(type => uploadedPhotoTypes.includes(type));

        return allItemsChecked && allPhotosUploaded;
    }

    /**
     * Submit permit for approval
     */
    async submitPermit(permitId) {
        try {
            const permit = await Permit.findByPk(permitId, {
                include: [{
                    model: Photo,
                    as: 'photos'
                }]
            });

            if (!permit) {
                return { success: false, error: 'Допуск не найден' };
            }

            if (permit.status !== 'pending') {
                return { success: false, error: 'Можно подавать только ожидающие допуски' };
            }

            // Check if permit is ready
            if (!this.isPermitReady(permit)) {
                return {
                    success: false,
                    error: 'Не все пункты чек-листа выполнены или не все фотографии загружены'
                };
            }

            // Approve permit automatically (in real app, this might require manual review)
            const issuedAt = new Date();
            const expiresAt = new Date(issuedAt.getTime() + this.PERMIT_DURATION_HOURS * 60 * 60 * 1000);

            await permit.update({
                status: 'active',
                issuedAt,
                expiresAt
            });

            // Enable Yandex Taxi orders
            const yandexResult = await yandexTaxiService.enableDriverOrders(permit.driverId);
            if (yandexResult.success) {
                await permit.update({ yandexTaxiEnabled: true });
            }

            return {
                success: true,
                message: 'Допуск успешно получен!',
                permit: {
                    id: permit.id,
                    status: permit.status,
                    issuedAt: permit.issuedAt,
                    expiresAt: permit.expiresAt,
                    yandexTaxiEnabled: permit.yandexTaxiEnabled
                }
            };

        } catch (error) {
            console.error('Submit permit error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Expire permits that are past their expiration time
     */
    async expirePermits() {
        try {
            const expiredPermits = await Permit.findAll({
                where: {
                    status: 'active',
                    expiresAt: {
                        [Op.lt]: new Date()
                    }
                }
            });

            for (const permit of expiredPermits) {
                // Disable Yandex Taxi orders
                if (permit.yandexTaxiEnabled) {
                    await yandexTaxiService.disableDriverOrders(permit.driverId);
                }

                // Update permit status
                await permit.update({
                    status: 'expired',
                    yandexTaxiEnabled: false
                });

                console.log(`Permit ${permit.id} for driver ${permit.driverId} has been expired`);
            }

            return {
                success: true,
                expiredCount: expiredPermits.length
            };

        } catch (error) {
            console.error('Expire permits error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get permit history for driver
     */
    async getPermitHistory(driverId, limit = 10) {
        try {
            const permits = await Permit.findAll({
                where: { driverId },
                order: [['createdAt', 'DESC']],
                limit,
                include: [{
                    model: Photo,
                    as: 'photos'
                }]
            });

            return { success: true, permits };
        } catch (error) {
            console.error('Get permit history error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new PermitService();