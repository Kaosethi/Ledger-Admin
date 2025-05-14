module.exports = {
  apps: [
    {
      name: "ledger-admin",
      script: "bun",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
