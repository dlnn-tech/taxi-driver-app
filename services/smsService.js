const axios = require('axios');
const { SmsCode } = require('../models');

class SmsService {
    constructor() {
        this.apiKey = process.env.WEBSMS_API_KEY;
        this.apiUrl = process.env.WEBSMS_API_URL || 'https://api.websms.ru/rest/sms';
    }

    /**
     * Generate a 4-digit verification code
     */
    generateCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * Send SMS code via WebSMS API
     */
    async sendSms(phone, code) {
        try {
            const message = `Ваш код подтверждения для входа в приложение Такси: ${code}. Никому не сообщайте этот код.`;
            
            const response = await axios.post(this.apiUrl, {
                login: this.apiKey,
                psw: process.env.WEBSMS_PASSWORD,
                phones: phone,
                mes: message,
                sender: 'TaxiApp'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.error_code === '0') {
                console.log(`SMS sent successfully to ${phone}`);
                return { success: true, messageId: response.data.id };
            } else {
                console.error('SMS sending failed:', response.data);
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            console.error('Error sending SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send verification code to phone number
     */
    async sendVerificationCode(phone) {
        try {
            // Clean phone number
            const cleanPhone = this.cleanPhoneNumber(phone);
            
            // Check rate limiting - allow only 1 SMS per 60 seconds per phone
            const recentCode = await SmsCode.findOne({
                where: {
                    phone: cleanPhone,
                    createdAt: {
                        [require('sequelize').Op.gte]: new Date(Date.now() - 60000) // 1 minute ago
                    }
                }
            });

            if (recentCode) {
                return {
                    success: false,
                    error: 'Код уже был отправлен. Попробуйте через минуту.'
                };
            }

            // Generate and save code
            const code = this.generateCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await SmsCode.create({
                phone: cleanPhone,
                code,
                expiresAt
            });

            // Send SMS (in development, just log the code)
            if (process.env.NODE_ENV === 'development') {
                console.log(`SMS Code for ${cleanPhone}: ${code}`);
                return { success: true, development: true };
            } else {
                const smsResult = await this.sendSms(cleanPhone, code);
                return smsResult;
            }
        } catch (error) {
            console.error('Error in sendVerificationCode:', error);
            return { success: false, error: 'Произошла ошибка при отправке SMS' };
        }
    }

    /**
     * Verify SMS code
     */
    async verifyCode(phone, code) {
        try {
            const cleanPhone = this.cleanPhoneNumber(phone);
            
            const smsCode = await SmsCode.findOne({
                where: {
                    phone: cleanPhone,
                    code,
                    isUsed: false,
                    expiresAt: {
                        [require('sequelize').Op.gte]: new Date()
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            if (!smsCode) {
                return {
                    success: false,
                    error: 'Неверный или истёкший код подтверждения'
                };
            }

            // Check attempts
            if (smsCode.attempts >= 3) {
                return {
                    success: false,
                    error: 'Превышено количество попыток ввода кода'
                };
            }

            // Mark code as used
            await smsCode.update({
                isUsed: true,
                attempts: smsCode.attempts + 1
            });

            return { success: true };
        } catch (error) {
            console.error('Error in verifyCode:', error);
            return { success: false, error: 'Произошла ошибка при проверке кода' };
        }
    }

    /**
     * Clean phone number format
     */
    cleanPhoneNumber(phone) {
        // Remove all non-numeric characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');
        
        // If starts with 8, replace with +7
        if (cleaned.startsWith('8')) {
            cleaned = '+7' + cleaned.substring(1);
        }
        
        // If doesn't start with +, add +7
        if (!cleaned.startsWith('+')) {
            cleaned = '+7' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Clean expired codes (run periodically)
     */
    async cleanExpiredCodes() {
        try {
            const deleted = await SmsCode.destroy({
                where: {
                    expiresAt: {
                        [require('sequelize').Op.lt]: new Date()
                    }
                }
            });
            
            if (deleted > 0) {
                console.log(`Cleaned ${deleted} expired SMS codes`);
            }
        } catch (error) {
            console.error('Error cleaning expired codes:', error);
        }
    }
}

module.exports = new SmsService();