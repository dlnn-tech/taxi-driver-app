// API client for the taxi driver app

class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = null;
        this.storage = null;
    }

    // Initialize with storage instance
    init(storage) {
        this.storage = storage;
        this.token = this.storage.get('authToken');
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add authorization header if token exists
        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Handle FormData for file uploads
        if (options.body instanceof FormData) {
            delete defaultOptions.headers['Content-Type'];
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Network error');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (this.storage) {
            this.storage.set('authToken', token);
        }
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        if (this.storage) {
            this.storage.remove('authToken');
        }
    }

    // Authentication endpoints
    async requestSMSCode(phone) {
        return this.request('/auth/request-code', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    }

    async verifySMSCode(phone, code) {
        return this.request('/auth/verify-code', {
            method: 'POST',
            body: JSON.stringify({ phone, code }),
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    // Permit endpoints
    async getCurrentPermit() {
        return this.request('/permit/current');
    }

    async updateChecklist(checklistData) {
        return this.request('/permit/checklist', {
            method: 'POST',
            body: JSON.stringify(checklistData),
        });
    }

    async uploadPhotos(formData) {
        return this.request('/permit/photos', {
            method: 'POST',
            body: formData,
        });
    }

    async submitPermit() {
        return this.request('/permit/submit', {
            method: 'POST',
        });
    }

    async getPermitHistory(limit = 10) {
        return this.request(`/permit/history?limit=${limit}`);
    }

    async checkPermitReady() {
        return this.request('/permit/ready');
    }

    // Info endpoints
    async getFAQ() {
        return this.request('/info/faq');
    }

    async getInstructions() {
        return this.request('/info/instructions');
    }

    async getSafetyInfo() {
        return this.request('/info/safety');
    }

    async getTerms() {
        return this.request('/info/terms');
    }

    // Contact endpoints
    async getContacts() {
        return this.request('/contact');
    }

    async getContactByType(type) {
        return this.request(`/contact/${type}`);
    }
}

// APIClient class - instances created in main app
