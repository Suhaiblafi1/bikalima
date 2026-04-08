module.exports = {
  apps: [{
    name: "biklima",
    script: "./index.mjs",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    env_file: ".env"
  }]
}
