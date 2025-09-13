// Authentication handler for the taxi driver app

class AuthManager {
    constructor() {
        this.currentPhone = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Phone form submission
        const phoneForm = document.getElementById('phone-form');
        if (phoneForm) {
            phoneForm.addEventListener('submit', this.handlePhoneSubmit.bind(this));
        }

        // Code form submission
        const codeForm = document.getElementById('code-form');
        if (codeForm) {
            codeForm.addEventListener('submit', this.handleCodeSubmit.bind(this));
        }

        // Back to phone button
        const backToPhoneBtn = document.getElementById('back-to-phone');
        if (backToPhoneBtn) {
            backToPhoneBtn.addEventListener('click', this.showPhoneStep.bind(this));
        }

        // Phone input formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.handlePhoneInput.bind(this));
        }

        // Code input validation
        const codeInput = document.getElementById('code');
        if (codeInput) {
            codeInput.addEventListener('input', this.handleCodeInput.bind(this));
        }
    }

    handlePhoneInput(event) {
        const input = event.target;
        let value = input.value;
        
        // Format phone number
        const formatted = formatPhoneNumber(value);
        input.value = formatted;
        
        // Enable/disable submit button
        const submitBtn = document.querySelector('#phone-form button[type="submit"]');
        const isValid = validatePhoneNumber(formatted);
        
        if (submitBtn) {
            submitBtn.disabled = !isValid;
        }
    }

    handleCodeInput(event) {
        const input = event.target;
        let value = input.value.replace(/\\D/g, ''); // Only numbers
        
        // Limit to 4 digits
        if (value.length > 4) {
            value = value.substring(0, 4);
        }
        
        input.value = value;
        
        // Enable/disable submit button
        const submitBtn = document.querySelector('#code-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = value.length !== 4;
        }
    }

    async handlePhoneSubmit(event) {
        event.preventDefault();
        
        const phoneInput = document.getElementById('phone');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        
        if (!phoneInput || !submitBtn) return;
        
        const phone = phoneInput.value;
        
        if (!validatePhoneNumber(phone)) {
            showToast('Введите корректный номер телефона', 'error');
            return;
        }

        setButtonLoading(submitBtn, true);

        try {
            const result = await api.requestSMSCode(phone);
            
            if (result.success) {
                this.currentPhone = phone;
                this.showCodeStep();
                
                if (result.development) {
                    showToast('Код отправлен (режим разработки)', 'info');
                } else {
                    showToast('Код подтверждения отправлен', 'success');
                }
            } else {
                showToast(result.message || 'Ошибка отправки SMS', 'error');
            }
        } catch (error) {
            console.error('Request SMS error:', error);
            showToast(error.message || 'Ошибка отправки SMS', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    }

    async handleCodeSubmit(event) {
        event.preventDefault();
        
        const codeInput = document.getElementById('code');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        
        if (!codeInput || !submitBtn) return;
        
        const code = codeInput.value;
        
        if (code.length !== 4) {
            showToast('Введите 4-значный код', 'error');
            return;
        }

        setButtonLoading(submitBtn, true);

        try {
            const result = await api.verifySMSCode(this.currentPhone, code);
            
            if (result.success) {
                // Save token and user data
                api.setToken(result.token);
                this.currentUser = result.driver;
                this.isAuthenticated = true;
                
                // Save user data to localStorage
                storage.set('currentUser', this.currentUser);
                
                showToast('Вход выполнен успешно!', 'success');
                
                // Navigate to main app
                this.showMainApp();
            } else {
                showToast(result.message || 'Неверный код подтверждения', 'error');
            }
        } catch (error) {
            console.error('Verify code error:', error);
            showToast(error.message || 'Ошибка подтверждения кода', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    }

    showPhoneStep() {
        const phoneStep = document.getElementById('phone-step');
        const codeStep = document.getElementById('code-step');
        
        if (phoneStep && codeStep) {
            phoneStep.style.display = 'block';
            codeStep.style.display = 'none';
        }
        
        // Clear code input
        const codeInput = document.getElementById('code');
        if (codeInput) {
            codeInput.value = '';
        }
    }

    showCodeStep() {
        const phoneStep = document.getElementById('phone-step');
        const codeStep = document.getElementById('code-step');
        
        if (phoneStep && codeStep) {
            phoneStep.style.display = 'none';
            codeStep.style.display = 'block';
            
            // Focus on code input
            const codeInput = document.getElementById('code');
            if (codeInput) {
                setTimeout(() => codeInput.focus(), 300);
            }
        }
    }

    showMainApp() {
        const authScreen = document.getElementById('auth-screen');
        const mainScreen = document.getElementById('main-screen');
        
        if (authScreen && mainScreen) {
            authScreen.style.display = 'none';
            mainScreen.style.display = 'block';
            
            // Initialize main app
            if (window.app && window.app.initialize) {
                window.app.initialize();
            }
        }
    }

    async checkAuthStatus() {
        const token = storage.get('authToken');
        const userData = storage.get('currentUser');
        
        if (!token || !userData) {
            this.logout();
            return false;
        }

        try {
            // Verify token is still valid
            const result = await api.getCurrentUser();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.currentUser = result.driver;
                api.setToken(token);
                
                // Update stored user data
                storage.set('currentUser', this.currentUser);
                
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
            return false;
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentPhone = null;
        
        api.clearToken();
        storage.remove('currentUser');
        
        // Show auth screen
        const authScreen = document.getElementById('auth-screen');
        const mainScreen = document.getElementById('main-screen');
        
        if (authScreen && mainScreen) {
            authScreen.style.display = 'block';
            mainScreen.style.display = 'none';
        }
        
        // Reset forms
        const phoneForm = document.getElementById('phone-form');
        const codeForm = document.getElementById('code-form');
        
        if (phoneForm) phoneForm.reset();
        if (codeForm) codeForm.reset();
        
        this.showPhoneStep();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();