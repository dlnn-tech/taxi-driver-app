// Utility functions for the taxi driver app

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/**
 * Format phone number
 */
function formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If starts with 8, replace with +7
    if (cleaned.startsWith('8')) {
        cleaned = '+7' + cleaned.substring(1);
    }
    
    // If doesn't start with +, add +7
    if (!cleaned.startsWith('+')) {
        cleaned = '+7' + cleaned;
    }
    
    // Format as +7 (XXX) XXX-XX-XX
    if (cleaned.length >= 12) {
        const formatted = cleaned.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5');
        return formatted;
    }
    
    return cleaned;
}

/**
 * Validate phone number
 */
function validatePhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    return cleaned.length >= 11 && cleaned.length <= 12;
}

/**
 * Format date and time
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // If less than 1 minute ago
    if (diff < 60000) {
        return 'только что';
    }
    
    // If less than 1 hour ago
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} мин. назад`;
    }
    
    // If less than 24 hours ago
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ч. назад`;
    }
    
    // If less than 7 days ago
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} д. назад`;
    }
    
    // Format as date
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format time remaining
 */
function formatTimeRemaining(expiresAt) {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) {
        return 'Истёк';
    }
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    }
    
    return `${minutes}м`;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading state on button
 */
function setButtonLoading(button, isLoading) {
    const textElement = button.querySelector('.btn-text');
    const loaderElement = button.querySelector('.btn-loader');
    
    if (isLoading) {
        button.disabled = true;
        if (textElement) textElement.style.display = 'none';
        if (loaderElement) loaderElement.style.display = 'block';
    } else {
        button.disabled = false;
        if (textElement) textElement.style.display = 'block';
        if (loaderElement) loaderElement.style.display = 'none';
    }
}

/**
 * Get file size in human readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is image
 */
function isImageFile(file) {
    return file && file.type.startsWith('image/');
}

/**
 * Generate preview URL for image file
 */
function generatePreviewURL(file) {
    return new Promise((resolve, reject) => {
        if (!isImageFile(file)) {
            reject(new Error('Not an image file'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Скопировано в буфер обмена', 'success');
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showToast('Не удалось скопировать', 'error');
        return false;
    }
}

/**
 * Local storage helpers
 */
const storage = {
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return null;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting to localStorage:', error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
};

/**
 * Check if device is mobile
 */
function isMobile() {
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Animate number counting
 */
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const startValue = start;
    const endValue = end;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutCubic);
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

/**
 * Check if user is online
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * Add network status listeners
 */
function addNetworkListeners() {
    window.addEventListener('online', () => {
        showToast('Соединение восстановлено', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('Нет соединения с интернетом', 'warning');
    });
}

// Initialize network listeners when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addNetworkListeners);
} else {
    addNetworkListeners();
}