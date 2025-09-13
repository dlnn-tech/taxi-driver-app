module.exports = {
  apps: [{
    name: 'taxi-driver-app',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Настройки для продакшена
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Автоперезапуск при изменении файлов (только для разработки)
    watch: false,
    // Игнорировать эти папки при watch
    ignore_watch: ['node_modules', 'logs', 'public'],
    // Задержка перед перезапуском
    restart_delay: 4000,
    // Максимальное количество перезапусков
    max_restarts: 10,
    // Минимальное время работы перед перезапуском
    min_uptime: '10s'
  }]
};