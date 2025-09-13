const AWS = require('aws-sdk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class StorageService {
    constructor() {
        this.s3 = new AWS.S3({
            endpoint: process.env.BACKBLAZE_ENDPOINT,
            accessKeyId: process.env.BACKBLAZE_KEY_ID,
            secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY,
            s3ForcePathStyle: true,
            signatureVersion: 'v4'
        });
        
        this.bucketName = process.env.BACKBLAZE_BUCKET_NAME;
    }

    /**
     * Upload photo to Backblaze B2
     */
    async uploadPhoto(buffer, originalName, mimeType, photoType, driverId) {
        try {
            // Generate unique filename
            const extension = path.extname(originalName);
            const filename = `${driverId}/${photoType}/${uuidv4()}${extension}`;

            // Upload parameters
            const uploadParams = {
                Bucket: this.bucketName,
                Key: filename,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'private', // Make photos private
                Metadata: {
                    'original-name': originalName,
                    'photo-type': photoType,
                    'driver-id': driverId.toString(),
                    'upload-date': new Date().toISOString()
                }
            };

            // Upload to Backblaze
            const result = await this.s3.upload(uploadParams).promise();

            return {
                success: true,
                url: result.Location,
                key: result.Key,
                etag: result.ETag,
                filename: filename
            };

        } catch (error) {
            console.error('Upload photo error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate signed URL for photo access
     */
    async getSignedUrl(key, expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Expires: expiresIn
            };

            const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
            return {
                success: true,
                url: signedUrl
            };

        } catch (error) {
            console.error('Get signed URL error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete photo from Backblaze B2
     */
    async deletePhoto(key) {
        try {
            const deleteParams = {
                Bucket: this.bucketName,
                Key: key
            };

            await this.s3.deleteObject(deleteParams).promise();

            return {
                success: true
            };

        } catch (error) {
            console.error('Delete photo error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate photo file
     */
    validatePhoto(file) {
        const errors = [];

        // Check file size (max 10MB)
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push(`Размер файла не должен превышать ${maxSize / 1024 / 1024}MB`);
        }

        // Check MIME type
        const allowedTypes = (process.env.ALLOWED_PHOTO_TYPES || 'image/jpeg,image/jpg,image/png').split(',');
        if (!allowedTypes.includes(file.mimetype)) {
            errors.push('Разрешены только файлы форматов JPG, JPEG, PNG');
        }

        // Basic image validation
        if (!file.mimetype.startsWith('image/')) {
            errors.push('Файл должен быть изображением');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Process multiple photo uploads
     */
    async uploadMultiplePhotos(files, driverId, permitId) {
        const uploadResults = [];
        const requiredTypes = ['waybill_1', 'waybill_2', 'car_exterior', 'car_interior'];

        for (const photoType of requiredTypes) {
            const file = files[photoType];
            
            if (!file) {
                uploadResults.push({
                    type: photoType,
                    success: false,
                    error: 'Фото не предоставлено'
                });
                continue;
            }

            // Validate photo
            const validation = this.validatePhoto(file[0]); // multer creates array
            if (!validation.isValid) {
                uploadResults.push({
                    type: photoType,
                    success: false,
                    error: validation.errors.join(', ')
                });
                continue;
            }

            // Upload photo
            const uploadResult = await this.uploadPhoto(
                file[0].buffer,
                file[0].originalname,
                file[0].mimetype,
                photoType,
                driverId
            );

            uploadResults.push({
                type: photoType,
                ...uploadResult
            });
        }

        return uploadResults;
    }
}

module.exports = new StorageService();