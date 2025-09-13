# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Setup and Environment
```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with actual API keys and database credentials
```

### Database Operations
```bash
# Run database migrations
npm run migrate

# Run database seeds
npm run seed

# Create database (MySQL required)
mysql -u root -p
CREATE DATABASE taxi_driver_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Development and Testing
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run single test file
jest path/to/test.js

# Run tests with coverage
jest --coverage
```

## Architecture Overview

This is a **taxi driver web application** with permit management and Yandex Taxi integration. The architecture follows a traditional Express.js MVC pattern with service layer abstraction.

### Core Components

**Backend Stack:**
- **Express.js** server with security middleware (helmet, CORS, rate limiting)
- **Sequelize ORM** with MySQL database
- **JWT authentication** with SMS verification
- **Multer** for file uploads to Backblaze S3
- **Node-cron** for scheduled permit expiration

**Frontend:**
- Vanilla JavaScript SPA served from `public/` directory
- Mobile-first responsive design for taxi drivers

### Key Business Logic

**Permit System Workflow:**
1. Driver requests SMS code → `smsService.sendVerificationCode()`
2. Code verification → JWT token issued → `generateToken()`
3. Driver creates pending permit → `permitService.getOrCreatePendingPermit()`
4. Complete checklist + upload photos → `permitService.updateChecklist()` + `permitService.uploadPhotos()`
5. Submit for approval → `permitService.submitPermit()` → Auto-approve if ready
6. Active permit expires after 16 hours → `permitService.expirePermits()` (cron job)
7. Yandex Taxi integration → `yandexTaxiService.enableDriverOrders()`

**Data Models Hierarchy:**
```
Driver (1) ──→ (M) Permit ──→ (M) Photo
               └─ SmsCode
```

### Service Layer Architecture

**Services (`services/`):**
- `permitService.js` - Core permit lifecycle management, validation, and business rules
- `yandexTaxiService.js` - External API integration with fallback for development mode
- `smsService.js` - SMS verification with WebSMS API
- `storageService.js` - Photo upload/management with Backblaze S3

**Key Integration Points:**
- **WebSMS API** - Phone verification (development mode outputs codes to console)
- **Backblaze S3** - Private photo storage with unique filenames
- **Yandex Taxi API** - Enable/disable driver orders based on permit status

### Database Schema

**Core Tables:**
- `drivers` - Phone-based authentication, car details, license info
- `permits` - Status (pending/active/expired/rejected), JSON checklist, expiration tracking
- `photos` - Linked to permits, required types: waybill_1, waybill_2, car_exterior, car_interior
- `sms_codes` - Temporary verification codes with expiration

### API Structure

**Routes (`routes/`):**
- `/api/auth/*` - SMS-based authentication flow
- `/api/permit/*` - Permit management CRUD operations  
- `/api/info/*` - Static content (FAQ, instructions, safety)
- `/api/contact/*` - Support contact information

### Development vs Production Behavior

**Development Mode (NODE_ENV=development):**
- SMS codes printed to console instead of sent
- API calls to Yandex Taxi simulated with success responses
- Detailed error messages exposed to frontend
- Database auto-sync enabled

**Production Mode:**
- Real SMS sending via WebSMS API
- Actual Yandex Taxi API calls
- Error details hidden from client
- Rate limiting strictly enforced

### Environment Variables

Required for development:
```bash
# Core
DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET

# External APIs (optional in dev)
WEBSMS_API_KEY
BACKBLAZE_KEY_ID, BACKBLAZE_APPLICATION_KEY, BACKBLAZE_BUCKET_NAME
YANDEX_TAXI_API_KEY, YANDEX_TAXI_PARTNER_ID
```

### Testing Strategy

- Jest configured for unit testing
- Test database isolation required
- Mock external API calls in tests
- Focus on service layer business logic

### Scheduled Tasks

**Cron Job (Hourly):**
- `expirePermits()` - Automatically expire permits after 16 hours
- Disables Yandex Taxi orders for expired permits
- Updates permit status from 'active' to 'expired'