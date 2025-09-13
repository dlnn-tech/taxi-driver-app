// Initialize global objects for the taxi driver app

// Step 1: Create storage first
window.storage = new StorageManager();

// Step 2: Create and initialize API
window.api = new APIClient();
window.api.init(window.storage);

// Step 3: Create other managers
window.authManager = new AuthManager();
window.permitManager = new PermitManager();
window.app = new TaxiDriverApp();

console.log('All objects initialized successfully');