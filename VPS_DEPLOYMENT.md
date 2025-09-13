# Развертывание на VPS

## Системные требования

- **OS**: Ubuntu 20.04/22.04 или CentOS 7+
- **RAM**: Минимум 1GB, рекомендуется 2GB
- **Storage**: Минимум 10GB свободного места
- **Node.js**: 16.x или выше
- **MySQL**: 5.7+ или 8.0+
- **Nginx**: Для проксирования (рекомендуется)

## Установка на Ubuntu/Debian

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Node.js
```bash
# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

### 3. Установка MySQL
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Создание базы данных
sudo mysql -u root -p
```

В MySQL консоли:
```sql
CREATE DATABASE taxi_driver_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taxi_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON taxi_driver_app.* TO 'taxi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Установка PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 5. Клонирование и настройка проекта
```bash
# Клонирование репозитория
git clone https://github.com/dlnn-tech/taxi-driver-app.git
cd taxi-driver-app

# Установка зависимостей
npm install

# Копирование и настройка environment файла
cp .env.example .env
nano .env
```

### 6. Настройка .env файла
```env
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=taxi_driver_app
DB_USER=taxi_user
DB_PASSWORD=secure_password

# JWT Secret (сгенерируйте надежный ключ)
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here

# WebSMS API Configuration
WEBSMS_API_KEY=your_websms_api_key
WEBSMS_API_URL=https://api.websms.ru/rest/sms

# Backblaze S3 Configuration
BACKBLAZE_KEY_ID=your_backblaze_key_id
BACKBLAZE_APPLICATION_KEY=your_backblaze_application_key
BACKBLAZE_BUCKET_NAME=taxi-driver-photos
BACKBLAZE_ENDPOINT=https://s3.eu-central-003.backblazeb2.com

# Yandex Taxi API Configuration
YANDEX_TAXI_API_KEY=your_yandex_taxi_api_key
YANDEX_TAXI_API_URL=https://api.taxi.yandex.ru/api/v1
YANDEX_TAXI_PARTNER_ID=your_partner_id

# Photo Storage Configuration
MAX_FILE_SIZE=10485760
ALLOWED_PHOTO_TYPES=image/jpeg,image/jpg,image/png
```

### 7. Запуск с PM2
```bash
# Создание PM2 ecosystem файла
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'taxi-driver-app',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Запуск приложения
pm2 start ecosystem.config.js --env production

# Сохранение PM2 конфигурации
pm2 save
pm2 startup
```

## Настройка Nginx (рекомендуется)

### 1. Установка Nginx
```bash
sudo apt install nginx -y
```

### 2. Создание конфигурации
```bash
sudo nano /etc/nginx/sites-available/taxi-driver-app
```

Содержимое конфигурации:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Логи
    access_log /var/log/nginx/taxi-driver-app.access.log;
    error_log /var/log/nginx/taxi-driver-app.error.log;

    # Проксирование к Node.js приложению
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Статические файлы (опционально - можно отдавать через Nginx)
    location /static/ {
        alias /path/to/taxi-driver-app/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Ограничение размера загрузки файлов
    client_max_body_size 10M;
}
```

### 3. Активация конфигурации
```bash
sudo ln -s /etc/nginx/sites-available/taxi-driver-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS с Let's Encrypt

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Настройка автообновления
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг и логи

### PM2 команды
```bash
# Статус приложений
pm2 status

# Логи
pm2 logs taxi-driver-app

# Перезапуск
pm2 restart taxi-driver-app

# Остановка
pm2 stop taxi-driver-app

# Мониторинг
pm2 monit
```

### Логи системы
```bash
# Логи приложения
pm2 logs taxi-driver-app --lines 100

# Логи Nginx
sudo tail -f /var/log/nginx/taxi-driver-app.access.log
sudo tail -f /var/log/nginx/taxi-driver-app.error.log

# Логи MySQL
sudo tail -f /var/log/mysql/error.log
```

## Обновление приложения

```bash
# Переход в директорию проекта
cd /path/to/taxi-driver-app

# Получение обновлений
git pull origin main

# Установка новых зависимостей (если есть)
npm install --production

# Перезапуск приложения
pm2 restart taxi-driver-app
```

## Резервное копирование

### Создание скрипта backup.sh
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
APP_DIR="/path/to/taxi-driver-app"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
mysqldump -u taxi_user -p'secure_password' taxi_driver_app > $BACKUP_DIR/db_backup_$DATE.sql

# Бэкап файлов приложения (без node_modules)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR --exclude=node_modules .

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Настройка автоматического бэкапа
```bash
# Добавить в crontab
0 2 * * * /path/to/backup.sh
```

## Безопасность

### Файрвол (UFW)
```bash
# Включение UFW
sudo ufw enable

# Разрешение SSH
sudo ufw allow ssh

# Разрешение HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Проверка статуса
sudo ufw status
```

### Обновления безопасности
```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Устранение неполадок

### Проблемы с подключением к базе данных
```bash
# Проверка статуса MySQL
sudo systemctl status mysql

# Перезапуск MySQL
sudo systemctl restart mysql

# Проверка подключения
mysql -u taxi_user -p taxi_driver_app
```

### Проблемы с производительностью
```bash
# Мониторинг ресурсов
htop
df -h
free -h

# Логи PM2
pm2 logs taxi-driver-app --err
```

### Проблемы с Nginx
```bash
# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx

# Статус Nginx
sudo systemctl status nginx
```