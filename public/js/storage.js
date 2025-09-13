// Local storage manager for the taxi driver app

class StorageManager {
    constructor() {
        this.prefix = 'taxi_driver_app_';
    }

    /**
     * Get item from local storage
     */
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    /**
     * Set item in local storage
     */
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * Remove item from local storage
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * Clear all app data from local storage
     */
    clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith(this.prefix)
            );
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Get all keys with prefix
     */
    keys() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        } catch (error) {
            console.error('Storage keys error:', error);
            return [];
        }
    }

    /**
     * Get storage size in bytes (approximate)
     */
    size() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (key.startsWith(this.prefix)) {
                    total += localStorage[key].length;
                }
            }
            return total;
        } catch (error) {
            console.error('Storage size error:', error);
            return 0;
        }
    }
}