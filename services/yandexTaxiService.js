const axios = require('axios');

class YandexTaxiService {
    constructor() {
        this.apiKey = process.env.YANDEX_TAXI_API_KEY;
        this.apiUrl = process.env.YANDEX_TAXI_API_URL || 'https://api.taxi.yandex.ru/api/v1';
        this.partnerId = process.env.YANDEX_TAXI_PARTNER_ID;
    }

    /**
     * Enable driver orders in Yandex Taxi
     */
    async enableDriverOrders(driverId) {
        try {
            // In development, simulate API call
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEVELOPMENT] Enabling Yandex Taxi orders for driver ${driverId}`);
                return {
                    success: true,
                    message: 'Driver orders enabled (development mode)',
                    driverId
                };
            }

            const response = await axios.post(`${this.apiUrl}/driver/enable`, {
                driver_id: driverId,
                partner_id: this.partnerId,
                enable_orders: true
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                console.log(`Yandex Taxi orders enabled for driver ${driverId}`);
                return {
                    success: true,
                    message: 'Driver orders enabled successfully',
                    driverId,
                    yandexResponse: response.data
                };
            } else {
                console.error('Failed to enable Yandex Taxi orders:', response.data);
                return {
                    success: false,
                    error: response.data.error || 'Unknown error',
                    driverId
                };
            }

        } catch (error) {
            console.error('Enable driver orders error:', error.message);
            
            // If it's a network/API error, still return success for now
            // In production, you might want to handle this differently
            return {
                success: false,
                error: error.message,
                driverId
            };
        }
    }

    /**
     * Disable driver orders in Yandex Taxi
     */
    async disableDriverOrders(driverId) {
        try {
            // In development, simulate API call
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEVELOPMENT] Disabling Yandex Taxi orders for driver ${driverId}`);
                return {
                    success: true,
                    message: 'Driver orders disabled (development mode)',
                    driverId
                };
            }

            const response = await axios.post(`${this.apiUrl}/driver/disable`, {
                driver_id: driverId,
                partner_id: this.partnerId,
                disable_orders: true
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                console.log(`Yandex Taxi orders disabled for driver ${driverId}`);
                return {
                    success: true,
                    message: 'Driver orders disabled successfully',
                    driverId,
                    yandexResponse: response.data
                };
            } else {
                console.error('Failed to disable Yandex Taxi orders:', response.data);
                return {
                    success: false,
                    error: response.data.error || 'Unknown error',
                    driverId
                };
            }

        } catch (error) {
            console.error('Disable driver orders error:', error.message);
            
            return {
                success: false,
                error: error.message,
                driverId
            };
        }
    }

    /**
     * Get driver status from Yandex Taxi
     */
    async getDriverStatus(driverId) {
        try {
            // In development, simulate API call
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEVELOPMENT] Getting Yandex Taxi status for driver ${driverId}`);
                return {
                    success: true,
                    status: {
                        driver_id: driverId,
                        orders_enabled: true,
                        status: 'active',
                        last_activity: new Date()
                    }
                };
            }

            const response = await axios.get(`${this.apiUrl}/driver/status`, {
                params: {
                    driver_id: driverId,
                    partner_id: this.partnerId
                },
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                return {
                    success: true,
                    status: response.data.driver_status
                };
            } else {
                return {
                    success: false,
                    error: response.data.error || 'Unknown error'
                };
            }

        } catch (error) {
            console.error('Get driver status error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Register driver with Yandex Taxi (if needed)
     */
    async registerDriver(driverData) {
        try {
            // In development, simulate API call
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEVELOPMENT] Registering driver with Yandex Taxi:`, driverData);
                return {
                    success: true,
                    message: 'Driver registered (development mode)',
                    driverId: driverData.id
                };
            }

            const response = await axios.post(`${this.apiUrl}/driver/register`, {
                driver_id: driverData.id,
                partner_id: this.partnerId,
                phone: driverData.phone,
                name: driverData.name,
                license_number: driverData.licenseNumber,
                car_number: driverData.carNumber,
                car_model: driverData.carModel
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                console.log(`Driver ${driverData.id} registered with Yandex Taxi`);
                return {
                    success: true,
                    message: 'Driver registered successfully',
                    driverId: driverData.id,
                    yandexDriverId: response.data.yandex_driver_id
                };
            } else {
                console.error('Failed to register driver with Yandex Taxi:', response.data);
                return {
                    success: false,
                    error: response.data.error || 'Unknown error'
                };
            }

        } catch (error) {
            console.error('Register driver error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update driver information in Yandex Taxi
     */
    async updateDriver(driverId, updateData) {
        try {
            // In development, simulate API call
            if (process.env.NODE_ENV === 'development') {
                console.log(`[DEVELOPMENT] Updating driver ${driverId} in Yandex Taxi:`, updateData);
                return {
                    success: true,
                    message: 'Driver updated (development mode)',
                    driverId
                };
            }

            const response = await axios.put(`${this.apiUrl}/driver/update`, {
                driver_id: driverId,
                partner_id: this.partnerId,
                ...updateData
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                console.log(`Driver ${driverId} updated in Yandex Taxi`);
                return {
                    success: true,
                    message: 'Driver updated successfully',
                    driverId
                };
            } else {
                console.error('Failed to update driver in Yandex Taxi:', response.data);
                return {
                    success: false,
                    error: response.data.error || 'Unknown error'
                };
            }

        } catch (error) {
            console.error('Update driver error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new YandexTaxiService();