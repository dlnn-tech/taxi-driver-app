// Main application controller for the taxi driver app

class TaxiDriverApp {
    constructor() {
        this.isInitialized = false;
        this.currentSection = 'dashboard';
        
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
                    loadingScreen.style.display = 'none';
                    appContainer.style.display = 'block';
                }
            }, 1000);

            // Check authentication status
            const isAuthenticated = await window.authManager.checkAuthStatus();
            
            if (isAuthenticated) {
                this.initialize();
            } else {
                // Show auth screen (default state)
                console.log('User not authenticated, showing login screen');
            }
            
        } catch (error) {
            console.error('App initialization error:', error);
            showToast('Ошибка инициализации приложения', 'error');
        }
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize main app components
            this.initializeNavigation();
            this.initializeProfileButton();
            
            // Show main app
            const authScreen = document.getElementById('auth-screen');
            const mainScreen = document.getElementById('main-screen');
            
            if (authScreen && mainScreen) {
                authScreen.style.display = 'none';
                mainScreen.style.display = 'block';
            }
            
            // Show dashboard by default
            this.navigateToSection('dashboard');
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization error:', error);
            showToast('Ошибка загрузки приложения', 'error');
        }
    }

    initializeNavigation() {
        // Menu items navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Back buttons
        const backButtons = document.querySelectorAll('.back-btn');
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                if (target) {
                    this.navigateToSection(target);
                }
            });
        });

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

    initializeProfileButton() {
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.showProfileMenu();
            });
        }
    }

    async loadInitialData() {
        try {
            // Only load data if user is authenticated and we have the main screen elements
            const mainScreen = document.getElementById('main-screen');
            if (!mainScreen || mainScreen.style.display === 'none') {
                console.log('Main screen not visible, skipping initial data load');
                return;
            }
            
            // Load permit status
            await window.permitManager.loadCurrentPermit();
            
            // Load order status
            await this.loadOrderStatus();
            
            // Initialize submit data button
            this.initializeSubmitDataButton();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    navigateToSection(sectionName) {
        // Hide current section
        const currentSection = document.getElementById(this.currentSection);
        if (currentSection) {
            currentSection.classList.remove('active');
        }

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Update header title
            const screenTitle = document.getElementById('screen-title');
            if (screenTitle) {
                const titles = {
                    dashboard: 'Главное меню',
                    permit: 'Допуск',
                    info: 'Полезная информация',
                    contacts: 'Контакты',
                    history: 'История допусков'
                };
                screenTitle.textContent = titles[sectionName] || 'Такси';
            }
            
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
                case 'info':
                    // Info content is already loaded in HTML
                    break;
                default:
                    // Other sections don't need dynamic loading
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${sectionName} content:`, error);
            showToast('Ошибка загрузки данных', 'error');
        }
    }

    async loadContacts() {
        const contactsList = document.getElementById('contacts-list');
        if (!contactsList) return;

        try {
            const result = await window.api.getContacts();
            
            if (result.success && result.contacts) {
                contactsList.innerHTML = result.contacts.map(contact => `
                    <div class="contact-item ${contact.priority ? 'priority' : ''}">
                        <div class="contact-header">
                            <h3>${contact.name}</h3>
                            <span class="contact-type">${contact.type}</span>
                        </div>
                        <p class="contact-description">${contact.description}</p>
                        <div class="contact-methods">
                            ${contact.phone ? `<a href="tel:${contact.phone}" class="contact-method">📞 ${contact.phone}</a>` : ''}
                            ${contact.telegram ? `<a href="${contact.telegram}" class="contact-method" target="_blank">📱 Telegram</a>` : ''}
                            ${contact.whatsapp ? `<a href="${contact.whatsapp}" class="contact-method" target="_blank">💬 WhatsApp</a>` : ''}
                            ${contact.email ? `<a href="mailto:${contact.email}" class="contact-method">📧 Email</a>` : ''}
                        </div>
                        <p class="contact-hours">Время работы: ${contact.workingHours}</p>
                    </div>
                `).join('');
            } else {
                contactsList.innerHTML = '<p>Не удалось загрузить контакты</p>';
            }
        } catch (error) {
            console.error('Failed to load contacts:', error);
            contactsList.innerHTML = '<p>Ошибка загрузки контактов</p>';
        }
    }

    async loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        try {
            const result = await api.getPermitHistory();
            
            if (result.success && result.permits) {
                if (result.permits.length === 0) {
                    historyList.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            <p>История допусков пуста</p>
                            <p>Получите первый допуск для начала работы</p>
                        </div>
                    `;
                } else {
                    historyList.innerHTML = result.permits.map(permit => {
                        const statusColors = {
                            active: 'var(--success-color)',
                            pending: 'var(--warning-color)',
                            expired: 'var(--error-color)',
                            rejected: 'var(--error-color)'
                        };

                        const statusTexts = {
                            active: 'Активен',
                            pending: 'В процессе',
                            expired: 'Истёк',
                            rejected: 'Отклонён'
                        };

                        return `
                            <div class="permit-item" style="background: var(--surface-color); border: 1px solid #E9ECEF; border-radius: var(--radius-lg); padding: var(--spacing-lg); margin-bottom: var(--spacing-md);">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
                                    <h4>Допуск #${permit.id}</h4>
                                    <span style="background: ${statusColors[permit.status]}; color: white; padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-sm); font-size: var(--font-size-xs);">
                                        ${statusTexts[permit.status]}
                                    </span>
                                </div>
                                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                                    Создан: ${formatDateTime(permit.createdAt)}
                                </p>
                                ${permit.issuedAt ? `
                                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                                        Получен: ${formatDateTime(permit.issuedAt)}
                                    </p>
                                ` : ''}
                                ${permit.expiresAt ? `
                                    <p style="color: var(--text-secondary);">
                                        ${permit.status === 'expired' ? 'Истёк' : 'Истекает'}: ${formatDateTime(permit.expiresAt)}
                                    </p>
                                ` : ''}
                            </div>
                        `;
                    }).join('');
                }
            } else {
                historyList.innerHTML = '<p>Не удалось загрузить историю</p>';
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            historyList.innerHTML = '<p>Ошибка загрузки истории</p>';
        }
    }

    async showInfoContent(infoType) {
        try {
            let result;
            let title;
            
            switch (infoType) {
                case 'faq':
                    result = await api.getFAQ();
                    title = 'Часто задаваемые вопросы';
                    break;
                case 'instructions':
                    result = await api.getInstructions();
                    title = 'Инструкции';
                    break;
                case 'safety':
                    result = await api.getSafetyInfo();
                    title = 'Требования безопасности';
                    break;
                default:
                    return;
            }
            
            if (result.success) {
                this.showInfoModal(title, result, infoType);
            }
        } catch (error) {
            console.error(`Failed to load ${infoType}:`, error);
            showToast('Ошибка загрузки информации', 'error');
        }
    }

    showInfoModal(title, data, type) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: var(--spacing-lg);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--surface-color);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            width: 100%;
        `;

        let contentHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-lg);">
                <h2>${title}</h2>
                <button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
            </div>
        `;

        // Generate content based on type
        if (type === 'faq') {
            contentHTML += data.faq.map(item => `
                <div style="margin-bottom: var(--spacing-lg);">
                    <h4 style="margin-bottom: var(--spacing-sm);">${item.question}</h4>
                    <p style="color: var(--text-secondary);">${item.answer}</p>
                </div>
            `).join('');
        } else if (type === 'instructions') {
            contentHTML += `<p style="margin-bottom: var(--spacing-lg);">${data.instructions.title}</p>`;
            contentHTML += data.instructions.steps.map(step => `
                <div style="display: flex; align-items: flex-start; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <div style="background: var(--primary-color); color: var(--secondary-color); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 600;">
                        ${step.step}
                    </div>
                    <div>
                        <h4 style="margin-bottom: var(--spacing-xs);">${step.title}</h4>
                        <p style="color: var(--text-secondary);">${step.description}</p>
                    </div>
                </div>
            `).join('');
        } else if (type === 'safety') {
            contentHTML += `<p style="margin-bottom: var(--spacing-lg);">${data.safety.title}</p>`;
            contentHTML += data.safety.sections.map(section => `
                <div style="margin-bottom: var(--spacing-lg);">
                    <h4 style="margin-bottom: var(--spacing-sm);">${section.title}</h4>
                    <ul style="margin-left: var(--spacing-lg);">
                        ${section.items.map(item => `<li style="margin-bottom: var(--spacing-xs); color: var(--text-secondary);">${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        }

        modalContent.innerHTML = contentHTML;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal handlers
        const closeModal = () => {
            if (modal && modal.parentNode) {
                document.body.removeChild(modal);
            }
        };

        document.getElementById('close-modal').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Animate in
        modal.style.opacity = '0';
        requestAnimationFrame(() => {
            modal.style.transition = 'opacity 0.3s ease-out';
            modal.style.opacity = '1';
        });
    }

    showProfileMenu() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        // Create Bulma modal
        const modal = document.createElement('div');
        modal.className = 'modal is-active';
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        <span class="icon mr-2">
                            <i class="fas fa-user"></i>
                        </span>
                        Профиль
                    </p>
                    <button class="delete" id="close-profile-modal" aria-label="close"></button>
                </header>
                <section class="modal-card-body">
                    <div class="has-text-centered mb-5">
                        <span class="icon is-large has-text-primary mb-3">
                            <i class="fas fa-user-circle fa-3x"></i>
                        </span>
                        <h3 class="title is-4">${user.name || 'Водитель'}</h3>
                        <p class="subtitle is-6 has-text-grey">${user.phone}</p>
                    </div>
                    
                    <div class="content">
                        ${user.carNumber ? `
                            <div class="field">
                                <label class="label">Автомобиль</label>
                                <p class="control">
                                    <span class="tag is-light is-medium">
                                        <i class="fas fa-car mr-2"></i>
                                        ${user.carModel || ''} ${user.carNumber}
                                    </span>
                                </p>
                            </div>
                        ` : ''}
                        ${user.email ? `
                            <div class="field">
                                <label class="label">Email</label>
                                <p class="control">
                                    <span class="tag is-light is-medium">
                                        <i class="fas fa-envelope mr-2"></i>
                                        ${user.email}
                                    </span>
                                </p>
                            </div>
                        ` : ''}
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button id="logout-btn" class="button is-danger">
                        <span class="icon">
                            <i class="fas fa-sign-out-alt"></i>
                        </span>
                        <span>Выйти</span>
                    </button>
                    <button id="cancel-profile-btn" class="button">Отмена</button>
                </footer>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        const closeModal = () => {
            if (modal && modal.parentNode) {
                document.body.removeChild(modal);
            }
        };

        document.getElementById('close-profile-modal').addEventListener('click', closeModal);
        document.getElementById('cancel-profile-btn').addEventListener('click', closeModal);
        document.getElementById('logout-btn').addEventListener('click', () => {
            closeModal();
            window.authManager.logout();
        });
        
        // Close on background click
        modal.querySelector('.modal-background').addEventListener('click', closeModal);
    }
    
    async loadOrderStatus() {
        const orderStatusIndicator = document.getElementById('order-status-indicator');
        if (!orderStatusIndicator) return;
        
        try {
            const result = await window.api.getDriverStatus();
            
            if (result.success && result.status) {
                const isEnabled = result.status.ordersEnabled;
                
                orderStatusIndicator.innerHTML = isEnabled 
                    ? `<span class="tag is-success">
                        <i class="fas fa-check-circle mr-1"></i>
                        Подключен к заказам
                       </span>`
                    : `<span class="tag is-danger">
                        <i class="fas fa-times-circle mr-1"></i>
                        Отключен от заказов
                       </span>`;
            } else {
                orderStatusIndicator.innerHTML = `
                    <span class="tag is-light">
                        <i class="fas fa-question-circle mr-1"></i>
                        Статус неизвестен
                    </span>`;
            }
        } catch (error) {
            console.error('Failed to load order status:', error);
            orderStatusIndicator.innerHTML = `
                <span class="tag is-danger">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Ошибка загрузки
                </span>`;
        }
    }
    
    initializeSubmitDataButton() {
        const submitBtn = document.getElementById('submit-data-btn');
        if (!submitBtn) return;
        
        submitBtn.addEventListener('click', () => {
            this.navigateToSection('permit');
        });
    }
}

// Create global app instance
const app = new TaxiDriverApp();

// Make app available globally for auth manager
window.app = app;