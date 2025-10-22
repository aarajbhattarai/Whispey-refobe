module.exports = {
  apps: [{
    name: 'whispey',
    script: 'npm',
    args: 'start',
    cwd: '/home/azureuser/whispey',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
