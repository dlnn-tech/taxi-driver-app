// Permit management for the taxi driver app

class PermitManager {
    constructor() {
        this.currentPermit = null;
        this.checklistItems = {
            plafon: 'Плафон установлен',
            carWrapped: 'Автомобиль оклеен',
            businessCard: 'Визитка закреплена',
            dashcam: 'Видеорегистратор включён',
            firstAidKit: 'Аптечка, огнетушитель, знак аварийной остановки',
            tireCondition: 'Состояние резины, стекло без трещин',
            lights: 'Световые приборы исправны',
            taximeter: 'Таксометр (если есть) включён',
            medicalCheck: 'Медосмотр и техосмотр пройдены'
        };
        
        this.photoTypes = {
            waybill_1: 'Путевой лист (страница 1)',
            waybill_2: 'Путевой лист (страница 2)', 
            car_exterior: 'Автомобиль снаружи',
            car_interior: 'Автомобиль внутри'
        };
        
        this.uploadedPhotos = {};
    }

    async loadCurrentPermit() {
        try {
            const result = await window.api.getCurrentPermit();
            
            if (result.success) {
                this.currentPermit = result.permit;
                this.updatePermitStatus();
                
                if (result.status === 'pending') {
                    // Permit checklist will be loaded when permit section is shown
                    console.log('Pending permit found, checklist will load when section is viewed');
                }
                
                return result.permit;
            }
        } catch (error) {
            console.error('Failed to load permit:', error);
            showToast('Ошибка загрузки информации о допуске', 'error');
        }
        
        return null;
    }

    updatePermitStatus() {
        const statusIndicator = document.getElementById('permit-indicator');
        const statusContent = document.getElementById('permit-content');
        const statusActions = document.getElementById('permit-actions');
        
        // If elements don't exist (e.g., on auth screen), skip update
        if (!statusIndicator || !statusContent || !statusActions) {
            console.log('Permit status elements not found, skipping update (probably on auth screen)');
            return;
        }

        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        // If status elements don't exist, skip update
        if (!statusDot || !statusText) {
            console.log('Status dot/text elements not found, skipping update');
            return;
        }

        if (this.currentPermit) {
            const permit = this.currentPermit;
            
            if (permit.status === 'active') {
                statusDot.className = 'status-dot active';
                statusText.textContent = 'Активен';
                
                const remaining = formatTimeRemaining(permit.expiresAt);
                statusContent.innerHTML = `
                    <p><strong>Допуск активен</strong></p>
                    <p>Истекает: ${remaining}</p>
                    <p>Получен: ${formatDateTime(permit.issuedAt)}</p>
                `;
                
                statusActions.style.display = 'none';
            } else if (permit.status === 'pending') {
                statusDot.className = 'status-dot pending';
                statusText.textContent = 'В процессе';
                
                statusContent.innerHTML = `
                    <p><strong>Заполните чек-лист и загрузите фотографии</strong></p>
                    <p>После выполнения всех требований вы сможете получить допуск</p>
                `;
                
                statusActions.innerHTML = `
                    <button id="continue-permit-btn" class="btn btn-primary">Продолжить оформление</button>
                `;
                
                this.initializeContinueButton();
                statusActions.style.display = 'block';
            } else if (permit.status === 'expired') {
                statusDot.className = 'status-dot expired';
                statusText.textContent = 'Истёк';
                
                statusContent.innerHTML = `
                    <p><strong>Допуск истёк</strong></p>
                    <p>Необходимо получить новый допуск для продолжения работы</p>
                `;
                
                statusActions.innerHTML = `
                    <button id="get-permit-btn" class="btn btn-primary">Получить новый допуск</button>
                `;
                
                this.initializeGetPermitButton();
                statusActions.style.display = 'block';
            }
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'Нет допуска';
            
            statusContent.innerHTML = `
                <p><strong>У вас нет активного допуска</strong></p>
                <p>Получите допуск для начала работы</p>
            `;
            
            statusActions.innerHTML = `
                <button id="get-permit-btn" class="btn btn-primary">Получить допуск</button>
            `;
            
            this.initializeGetPermitButton();
            statusActions.style.display = 'block';
        }
    }

    initializeGetPermitButton() {
        const btn = document.getElementById('get-permit-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.showPermitSection();
            });
        }
    }

    initializeContinueButton() {
        const btn = document.getElementById('continue-permit-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.showPermitSection();
            });
        }
    }

    showPermitSection() {
        const permitSection = document.getElementById('permit');
        const dashboard = document.getElementById('dashboard');
        const screenTitle = document.getElementById('screen-title');
        
        if (permitSection && dashboard && screenTitle) {
            dashboard.classList.remove('active');
            permitSection.classList.add('active');
            screenTitle.textContent = 'Допуск';
            
            this.loadPermitContent();
        }
    }

    async loadPermitContent() {
        const container = document.getElementById('permit-content-container');
        if (!container) return;

        container.innerHTML = `
            <div class="checklist">
                <h3>Чек-лист готовности</h3>
                <div id="checklist-items">
                    <!-- Items will be loaded here -->
                </div>
            </div>
            
            <div class="photo-upload">
                <h3>Загрузка фотографий</h3>
                <p>Сделайте фотографии камерой телефона. Загрузка из галереи запрещена.</p>
                <div class="photo-grid" id="photo-grid">
                    <!-- Photo items will be loaded here -->
                </div>
            </div>
            
            <div id="submit-section" style="text-align: center; margin-top: 2rem;">
                <button id="submit-permit-btn" class="btn btn-primary" disabled>
                    Получить допуск
                </button>
            </div>
        `;

        this.loadChecklistItems();
        this.loadPhotoItems();
        this.initializeSubmitButton();
    }

    loadChecklistItems() {
        const container = document.getElementById('checklist-items');
        if (!container) return;

        const checklist = this.currentPermit?.checklist || {};
        
        container.innerHTML = Object.entries(this.checklistItems).map(([key, label]) => `
            <div class="checklist-item">
                <input type="checkbox" id="checklist-${key}" ${checklist[key] ? 'checked' : ''}>
                <label for="checklist-${key}">${label}</label>
            </div>
        `).join('');

        // Add event listeners
        Object.keys(this.checklistItems).forEach(key => {
            const checkbox = document.getElementById(`checklist-${key}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateChecklist(key, checkbox.checked);
                });
            }
        });
    }

    loadPhotoItems() {
        const container = document.getElementById('photo-grid');
        if (!container) return;

        const existingPhotos = this.currentPermit?.photos || [];
        const photoMap = {};
        existingPhotos.forEach(photo => {
            photoMap[photo.type] = photo;
        });

        container.innerHTML = Object.entries(this.photoTypes).map(([key, label]) => {
            const hasPhoto = photoMap[key];
            return `
                <div class="photo-item ${hasPhoto ? 'uploaded' : ''}" data-type="${key}">
                    <input type="file" id="photo-${key}" accept="image/*" capture="environment">
                    <div class="photo-icon">${hasPhoto ? '✅' : '📷'}</div>
                    <div class="photo-title">${label}</div>
                    <div class="photo-description">
                        ${hasPhoto ? 'Загружено' : 'Нажмите для съёмки'}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for photo items
        Object.keys(this.photoTypes).forEach(key => {
            const photoItem = container.querySelector(`.photo-item[data-type="${key}"]`);
            const fileInput = document.getElementById(`photo-${key}`);
            
            if (photoItem && fileInput) {
                photoItem.addEventListener('click', () => {
                    fileInput.click();
                });
                
                fileInput.addEventListener('change', (event) => {
                    this.handlePhotoSelection(key, event.target.files[0]);
                });
            }
        });
    }

    async updateChecklist(key, checked) {
        try {
            const updateData = { [key]: checked };
            const result = await window.api.updateChecklist(updateData);
            
            if (result.success) {
                // Update local state
                if (!this.currentPermit.checklist) {
                    this.currentPermit.checklist = {};
                }
                this.currentPermit.checklist[key] = checked;
                
                this.checkSubmitReadiness();
                showToast('Чек-лист обновлён', 'success');
            }
        } catch (error) {
            console.error('Failed to update checklist:', error);
            showToast('Ошибка обновления чек-листа', 'error');
            
            // Revert checkbox state
            const checkbox = document.getElementById(`checklist-${key}`);
            if (checkbox) {
                checkbox.checked = !checked;
            }
        }
    }

    async handlePhotoSelection(type, file) {
        if (!file) return;

        // Validate file
        if (!isImageFile(file)) {
            showToast('Выберите изображение', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            showToast('Размер файла не должен превышать 10MB', 'error');
            return;
        }

        // Store file for upload
        this.uploadedPhotos[type] = file;
        
        // Update UI
        const photoItem = document.querySelector(`.photo-item[data-type="${type}"]`);
        if (photoItem) {
            photoItem.classList.add('uploaded');
            photoItem.querySelector('.photo-icon').textContent = '✅';
            photoItem.querySelector('.photo-description').textContent = 'Готово к загрузке';
        }

        this.checkSubmitReadiness();
        showToast(`Фото "${this.photoTypes[type]}" выбрано`, 'success');
    }

    checkSubmitReadiness() {
        const submitBtn = document.getElementById('submit-permit-btn');
        if (!submitBtn) return;

        const checklist = this.currentPermit?.checklist || {};
        const allChecklistDone = Object.keys(this.checklistItems).every(key => checklist[key]);
        
        const existingPhotos = this.currentPermit?.photos || [];
        const existingPhotoTypes = existingPhotos.map(p => p.type);
        const newPhotoTypes = Object.keys(this.uploadedPhotos);
        const allPhotoTypes = [...existingPhotoTypes, ...newPhotoTypes];
        const allPhotosDone = Object.keys(this.photoTypes).every(type => allPhotoTypes.includes(type));

        const isReady = allChecklistDone && allPhotosDone;
        
        submitBtn.disabled = !isReady;
        
        if (isReady) {
            submitBtn.textContent = 'Получить допуск';
        } else {
            const missing = [];
            if (!allChecklistDone) missing.push('чек-лист');
            if (!allPhotosDone) missing.push('фотографии');
            submitBtn.textContent = `Требуется: ${missing.join(', ')}`;
        }
    }

    initializeSubmitButton() {
        const submitBtn = document.getElementById('submit-permit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', this.handleSubmitPermit.bind(this));
        }
        
        // Initial check
        this.checkSubmitReadiness();
    }

    async handleSubmitPermit() {
        const submitBtn = document.getElementById('submit-permit-btn');
        if (!submitBtn || submitBtn.disabled) return;

        setButtonLoading(submitBtn, true);

        try {
            // First upload photos if any
            if (Object.keys(this.uploadedPhotos).length > 0) {
                await this.uploadPhotos();
            }

            // Then submit permit
            const result = await window.api.submitPermit();
            
            if (result.success) {
                showToast(result.message || 'Допуск получен!', 'success');
                
                // Reload permit data
                await this.loadCurrentPermit();
                
                // Navigate back to dashboard
                this.showDashboard();
            } else {
                showToast(result.message || 'Ошибка получения допуска', 'error');
            }
        } catch (error) {
            console.error('Submit permit error:', error);
            showToast(error.message || 'Ошибка получения допуска', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    }

    async uploadPhotos() {
        const formData = new FormData();
        
        Object.entries(this.uploadedPhotos).forEach(([type, file]) => {
            formData.append(type, file);
        });

        const result = await window.api.uploadPhotos(formData);
        
        if (result.success) {
            // Clear uploaded photos cache
            this.uploadedPhotos = {};
            showToast('Фотографии загружены', 'success');
        } else {
            throw new Error(result.message || 'Ошибка загрузки фотографий');
        }
    }

    showDashboard() {
        const permitSection = document.getElementById('permit');
        const dashboard = document.getElementById('dashboard');
        const screenTitle = document.getElementById('screen-title');
        
        if (permitSection && dashboard && screenTitle) {
            permitSection.classList.remove('active');
            dashboard.classList.add('active');
            screenTitle.textContent = 'Главное меню';
        }
    }
}

// Create global permit manager instance
const permitManager = new PermitManager();