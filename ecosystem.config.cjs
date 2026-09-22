/**
 * PM2 — produção SETAD
 * Uso no servidor: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "setad",
      script: "server/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
