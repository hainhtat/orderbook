// Order Notebook API — isolated PM2 process (does not touch other pm2 apps)
module.exports = {
  apps: [
    {
      name: 'order-notebook-api',
      cwd: '/opt/order-notebook/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
