// Main application controller for DaisyUI version

class TaxiDriverApp {
    constructor() {
        this.isInitialized = false;
        this.currentSection = 'dashboard';
        this.currentTheme = localStorage.getItem('theme') || 'corporate';
        
        this.initializeOnLoad();
    }

    initializeOnLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.handleDOMReady.bind(this));
        } else {
            this.handleDOMReady();
        }
    }

    async handleDOMReady() {
        try {
            // Apply saved theme
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            
            // Clear potentially corrupted auth data on fresh page load
            if (window.authManager && window.authManager.clearStoredAuth) {
                console.log('Clearing potentially stale auth data on startup');
                window.authManager.clearStoredAuth();
            }
            
            // Hide loading screen after a short delay
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                const appContainer = document.getElementById('app');
                
                if (loadingScreen && appContainer) {
                    loadingScreen.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        appContainer.style.display = 'block';
                        appContainer.classList.add('slide-up');
                    }, 500);
                }
            }, 1000);

            // Check authentication status
            const isAuthenticated = await window.authManager.checkAuthStatus();
            
            if (isAuthenticated) {
                this.initialize();
            } else {
                console.log('User not authenticated, showing login screen');
            }
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showToast('Ошибка инициализации приложения', 'error');
        }
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize main app components
            this.initializeNavigation();
            this.initializeProfileMenu();
            this.initializeThemeToggle();
            
            // Show main app
            const authScreen = document.getElementById('auth-screen');
            const mainScreen = document.getElementById('main-screen');
            
            if (authScreen && mainScreen) {
                authScreen.style.display = 'none';
                mainScreen.style.display = 'block';
                mainScreen.classList.add('slide-up');
            }
            
            // Show dashboard by default
            this.navigateToSection('dashboard');
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showToast('Ошибка загрузки приложения', 'error');
        }
    }

    initializeNavigation() {
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.navigateToSection(section);
                    // Close mobile menu if open
                    const dropdowns = document.querySelectorAll('.dropdown');
                    dropdowns.forEach(dd => dd.removeAttribute('open'));
                }
            });
        });

        // Submit data button
        const submitBtn = document.getElementById('submit-data-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.navigateToSection('permit');
            });
        }

        // Info items
        const infoItems = document.querySelectorAll('.info-item');
        infoItems.forEach(item => {
            item.addEventListener('click', () => {
                const infoType = item.getAttribute('data-info');
                if (infoType) {
                    this.showInfoContent(infoType);
                }
            });
        });
    }

    initializeProfileMenu() {
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.showProfileModal();
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.authManager.logout();
            });
        }
    }

    initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const themes = ['corporate', 'business', 'light', 'dark'];
                const currentIndex = themes.indexOf(this.currentTheme);
                const nextIndex = (currentIndex + 1) % themes.length;
                this.currentTheme = themes[nextIndex];
                
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                localStorage.setItem('theme', this.currentTheme);
                
                this.showToast(`Тема изменена на ${this.getThemeName(this.currentTheme)}`, 'success');
            });
        }
    }

    getThemeName(theme) {
        const names = {
            'corporate': 'Корпоративная',
            'business': 'Бизнес',
            'light': 'Светлая',
            'dark': 'Тёмная'
        };
        return names[theme] || theme;
    }

    async loadInitialData() {
        try {
            const mainScreen = document.getElementById('main-screen');
            if (!mainScreen || mainScreen.style.display === 'none') {
                console.log('Main screen not visible, skipping initial data load');
                return;
            }
            
            // Load permit status
            await window.permitManager.loadCurrentPermit();
            
            // Load order status
            await this.loadOrderStatus();
            
            // Update user info in stats
            this.updateUserStats();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    async loadOrderStatus() {
        const orderStatusIndicator = document.getElementById('order-status-indicator');
        if (!orderStatusIndicator) return;
        
        try {
            const result = await window.api.getDriverStatus();
            
            if (result.success && result.status) {
                const isEnabled = result.status.ordersEnabled;
                
                orderStatusIndicator.innerHTML = isEnabled 
                    ? `<div class="badge badge-success gap-2">
                        <i class="fas fa-check-circle"></i>
                        Подключен к заказам
                       </div>`
                    : `<div class="badge badge-error gap-2">
                        <i class="fas fa-times-circle"></i>
                        Отключен от заказов
                       </div>`;
            } else {
                orderStatusIndicator.innerHTML = `
                    <div class="badge badge-ghost gap-2">
                        <i class="fas fa-question-circle"></i>
                        Статус неизвестен
                    </div>`;
            }
        } catch (error) {
            console.error('Failed to load order status:', error);
            orderStatusIndicator.innerHTML = `
                <div class="badge badge-error gap-2">
                    <i class="fas fa-exclamation-triangle"></i>
                    Ошибка загрузки
                </div>`;
        }
    }

    updateUserStats() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        // Update car info in stats
        const carNumber = document.querySelector('.stat-value.text-primary');
        const carModel = document.querySelector('.stat-desc');
        
        if (carNumber && user.carNumber) {
            carNumber.textContent = user.carNumber;
        }
        if (carModel && user.carModel) {
            carModel.textContent = user.carModel;
        }
    }

    navigateToSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('slide-up');
            this.currentSection = sectionName;
            
            // Update header title
            const screenTitle = document.getElementById('screen-title');
            if (screenTitle) {
                const titles = {
                    dashboard: 'Главная',
                    permit: 'Допуск',
                    info: 'Информация',
                    contacts: 'Контакты',
                    history: 'История'
                };
                screenTitle.textContent = titles[sectionName] || 'Такси';
            }
            
            // Update active nav item
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                if (item.getAttribute('data-section') === sectionName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Load section-specific content
            this.loadSectionContent(sectionName);
        }
    }

    async loadSectionContent(sectionName) {
        try {
            switch (sectionName) {
                case 'contacts':
                    await this.loadContacts();
                    break;
                case 'history':
                    await this.loadHistory();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${sectionName} content:`, error);
            this.showToast('Ошибка загрузки данных', 'error');
        }
    }

    async loadContacts() {
        const contactsList = document.getElementById('contacts-list');
        if (!contactsList) return;

        try {
            const result = await window.api.getContacts();
            
            if (result.success && result.contacts) {
                contactsList.innerHTML = result.contacts.map(contact => `
                    <div class="card bg-base-200">
                        <div class="card-body">
                            <h3 class="card-title">
                                <i class="fas fa-${this.getContactIcon(contact.type)}"></i>
                                ${contact.name}
                            </h3>
                            <p class="text-sm opacity-70">${contact.position || contact.type}</p>
                            <div class="card-actions justify-end mt-4">
                                <a href="tel:${contact.phone}" class="btn btn-primary btn-sm">
                                    <i class="fas fa-phone mr-2"></i>
                                    ${contact.phone}
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                contactsList.innerHTML = '<p class="text-center">Контакты не найдены</p>';
            }
        } catch (error) {
            contactsList.innerHTML = '<p class="text-center text-error">Ошибка загрузки контактов</p>';
        }
    }

    async loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        try {
            const result = await window.api.getPermitHistory();
            
            if (result.success && result.permits && result.permits.length > 0) {
                historyList.innerHTML = result.permits.map(permit => `
                    <div class="card bg-base-200 mb-4">
                        <div class="card-body">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="badge ${this.getStatusBadgeClass(permit.status)} mb-2">
                                        ${this.getStatusText(permit.status)}
                                    </div>
                                    <p class="text-sm opacity-70">
                                        Создан: ${new Date(permit.createdAt).toLocaleDateString('ru-RU')}
                                    </p>
                                    ${permit.expiresAt ? `
                                        <p class="text-sm opacity-70">
                                            Истекает: ${new Date(permit.expiresAt).toLocaleDateString('ru-RU')}
                                        </p>
                                    ` : ''}
                                </div>
                                <button class="btn btn-ghost btn-sm">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                historyList.innerHTML = '<p class="text-center">История допусков пуста</p>';
            }
        } catch (error) {
            historyList.innerHTML = '<p class="text-center text-error">Ошибка загрузки истории</p>';
        }
    }

    getContactIcon(type) {
        const icons = {
            'support': 'headset',
            'manager': 'user-tie',
            'technical': 'tools',
            'emergency': 'exclamation-triangle'
        };
        return icons[type] || 'user';
    }

    getStatusBadgeClass(status) {
        const classes = {
            'pending': 'badge-warning',
            'active': 'badge-success',
            'expired': 'badge-error',
            'rejected': 'badge-error'
        };
        return classes[status] || 'badge-ghost';
    }

    getStatusText(status) {
        const texts = {
            'pending': 'В обработке',
            'active': 'Активен',
            'expired': 'Истёк',
            'rejected': 'Отклонён'
        };
        return texts[status] || status;
    }

    async showInfoContent(type) {
        try {
            let data;
            switch (type) {
                case 'faq':
                    data = await window.api.getFAQ();
                    break;
                case 'instructions':
                    data = await window.api.getInstructions();
                    break;
                case 'safety':
                    data = await window.api.getSafetyInfo();
                    break;
                default:
                    return;
            }

            if (data && data.success) {
                this.showInfoModal(type, data);
            }
        } catch (error) {
            console.error('Failed to load info content:', error);
            this.showToast('Ошибка загрузки информации', 'error');
        }
    }

    showInfoModal(type, data) {
        const modal = document.createElement('dialog');
        modal.className = 'modal modal-open';
        
        let content = '';
        const titles = {
            'faq': 'Часто задаваемые вопросы',
            'instructions': 'Инструкции',
            'safety': 'Требования безопасности'
        };

        modal.innerHTML = `
            <div class="modal-box max-w-3xl">
                <h3 class="font-bold text-lg mb-4">${titles[type]}</h3>
                <div class="py-4">
                    ${this.formatInfoContent(type, data)}
                </div>
                <div class="modal-action">
                    <button class="btn" onclick="this.closest('.modal').remove()">Закрыть</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;

        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            modal.remove();
        });
    }

    formatInfoContent(type, data) {
        if (type === 'faq' && data.faq) {
            return data.faq.items.map(item => `
                <div class="collapse collapse-arrow bg-base-200 mb-2">
                    <input type="radio" name="faq-accordion" />
                    <div class="collapse-title text-xl font-medium">
                        ${item.question}
                    </div>
                    <div class="collapse-content">
                        <p>${item.answer}</p>
                    </div>
                </div>
            `).join('');
        } else if (type === 'instructions' && data.instructions) {
            return data.instructions.steps.map(step => `
                <div class="flex gap-4 mb-4">
                    <div class="badge badge-primary badge-lg">${step.step}</div>
                    <div>
                        <h4 class="font-bold">${step.title}</h4>
                        <p class="opacity-70">${step.description}</p>
                    </div>
                </div>
            `).join('');
        } else if (type === 'safety' && data.safety) {
            return data.safety.sections.map(section => `
                <div class="mb-4">
                    <h4 class="font-bold mb-2">${section.title}</h4>
                    <ul class="list-disc list-inside opacity-70">
                        ${section.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        }
        return '';
    }

    showProfileModal() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        const modal = document.createElement('dialog');
        modal.className = 'modal modal-open';
        
        modal.innerHTML = `
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">Профиль водителя</h3>
                <div class="text-center mb-6">
                    <div class="avatar placeholder mb-4">
                        <div class="bg-primary text-primary-content rounded-full w-24">
                            <span class="text-3xl">${user.name ? user.name.charAt(0).toUpperCase() : 'В'}</span>
                        </div>
                    </div>
                    <h4 class="text-xl font-bold">${user.name || 'Водитель'}</h4>
                    <p class="opacity-70">${user.phone}</p>
                </div>
                
                <div class="space-y-2">
                    ${user.carNumber ? `
                        <div class="flex justify-between">
                            <span class="opacity-70">Автомобиль:</span>
                            <span class="font-medium">${user.carModel || ''} ${user.carNumber}</span>
                        </div>
                    ` : ''}
                    ${user.email ? `
                        <div class="flex justify-between">
                            <span class="opacity-70">Email:</span>
                            <span class="font-medium">${user.email}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-action">
                    <button class="btn btn-error" onclick="window.authManager.logout()">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        Выйти
                    </button>
                    <button class="btn" onclick="this.closest('.modal').remove()">Закрыть</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;

        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            modal.remove();
        });
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const alertTypes = {
            'success': 'alert-success',
            'error': 'alert-error',
            'warning': 'alert-warning',
            'info': 'alert-info'
        };

        const toast = document.createElement('div');
        toast.className = `alert ${alertTypes[type] || 'alert-info'} shadow-lg`;
        toast.innerHTML = `
            <div>
                <span>${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
}

// Create global app instance
const app = new TaxiDriverApp();

// Make app available globally
window.app = app;