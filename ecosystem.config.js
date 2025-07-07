module.exports = {
  apps: [{
    name: "mybooks",  // ← Match existing PM2 name
    script: "npm",
    args: "start",
    cwd: "/home/zk/projects/reading-habit-tracker",
    env: {
      NODE_ENV: "production"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M"
  }]
};
