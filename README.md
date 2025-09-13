# Taxi Driver Web Application

Веб-приложение для водителей такси с системой допусков и интеграцией с Яндекс.Такси.

## Функциональность

### Авторизация
- Авторизация по номеру телефона
- SMS подтверждение через API WebSMS
- JWT токены для сессий

### Система допусков
- Интерактивный чек-лист готовности
- Загрузка фотографий с камеры телефона
- Автоматическое истечение допуска через 16 часов
- Интеграция с Яндекс.Такси API

### Дополнительные функции
- Полезная информация (FAQ, инструкции, требования безопасности)
- Контакты поддержки
- История допусков
- Адаптивный дизайн для мобильных устройств

## Технические требования

### Backend
- Node.js 16+
- Express.js
- Sequelize ORM
- MySQL/MariaDB
- JWT для авторизации
- Multer для загрузки файлов

### Frontend
- Современный адаптивный интерфейс
- Vanilla JavaScript (ES6+)
- CSS Grid и Flexbox
- PWA возможности

### Интеграции
- **WebSMS API** - отправка SMS кодов
- **Backblaze S3** - хранение фотографий
- **Яндекс.Такси API** - управление допусками водителей

## Установка и настройка

### 1. Клонирование и установка зависимостей

\`\`\`bash
# Установка зависимостей
npm install
\`\`\`

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и заполните переменные:

\`\`\`bash
cp .env.example .env
\`\`\`

### Обязательные переменные:

\`\`\`env
# Сервер
PORT=3000
NODE_ENV=development
JWT_SECRET=your_very_long_and_secure_jwt_secret

# База данных
DB_HOST=localhost
DB_PORT=3306
DB_NAME=taxi_driver_app
DB_USER=root
DB_PASSWORD=your_password

# WebSMS API
WEBSMS_API_KEY=your_api_key
WEBSMS_PASSWORD=your_password

# Backblaze S3
BACKBLAZE_KEY_ID=your_key_id
BACKBLAZE_APPLICATION_KEY=your_application_key
BACKBLAZE_BUCKET_NAME=taxi-driver-photos
BACKBLAZE_ENDPOINT=https://s3.eu-central-003.backblazeb2.com

# Яндекс.Такси API
YANDEX_TAXI_API_KEY=your_api_key
YANDEX_TAXI_PARTNER_ID=your_partner_id
\`\`\`

### 3. Настройка базы данных

\`\`\`bash
# Создайте базу данных MySQL
mysql -u root -p
CREATE DATABASE taxi_driver_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
\`\`\`

### 4. Запуск приложения

\`\`\`bash
# Режим разработки
npm run dev

# Продакшен
npm start
\`\`\`

## Структура проекта

\`\`\`
taxi-driver-app/
├── config/
│   └── database.js          # Конфигурация базы данных
├── models/                  # Модели Sequelize
│   ├── Driver.js
│   ├── SmsCode.js
│   ├── Permit.js
│   └── Photo.js
├── routes/                  # API маршруты
│   ├── auth.js
│   ├── permit.js
│   ├── info.js
│   └── contact.js
├── services/                # Бизнес-логика
│   ├── smsService.js
│   ├── storageService.js
│   ├── permitService.js
│   └── yandexTaxiService.js
├── middleware/              # Middleware
│   └── auth.js
├── public/                  # Статические файлы
│   ├── css/
│   ├── js/
│   ├── images/
│   └── index.html
└── server.js               # Главный файл сервера
\`\`\`

## API Endpoints

### Авторизация
- `POST /api/auth/request-code` - Запрос SMS кода
- `POST /api/auth/verify-code` - Подтверждение кода
- `GET /api/auth/me` - Получить текущего пользователя
- `PUT /api/auth/profile` - Обновить профиль

### Допуски
- `GET /api/permit/current` - Текущий допуск
- `POST /api/permit/checklist` - Обновить чек-лист
- `POST /api/permit/photos` - Загрузить фотографии
- `POST /api/permit/submit` - Подать на получение допуска
- `GET /api/permit/history` - История допусков

### Информация
- `GET /api/info/faq` - Часто задаваемые вопросы
- `GET /api/info/instructions` - Инструкции
- `GET /api/info/safety` - Требования безопасности

### Контакты
- `GET /api/contact` - Список контактов
- `GET /api/contact/:type` - Контакт по типу

## Разработка

### Режим разработки
В режиме разработки SMS коды не отправляются, а выводятся в консоль сервера.

### Тестирование
\`\`\`bash
npm test
\`\`\`

### Линтинг
\`\`\`bash
npm run lint
\`\`\`

## Деплой

### Переменные продакшена
1. Установите `NODE_ENV=production`
2. Настройте все API ключи
3. Используйте HTTPS
4. Настройте базу данных
5. Настройте файловое хранилище

### PM2 (рекомендуется)
\`\`\`bash
npm install -g pm2
pm2 start server.js --name taxi-driver-app
pm2 startup
pm2 save
\`\`\`

## Безопасность

- JWT токены с ограниченным временем жизни
- Rate limiting на всех endpoints
- Валидация всех входных данных
- HTTPS обязателен в продакшене
- Приватное хранение фотографий в S3

## Лицензия

ISC

## Поддержка

Для вопросов по настройке и разработке обращайтесь к документации API или создавайте issue в репозитории.