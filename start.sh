#!/bin/bash
cd /home/node/app
if command -v pm2 &>/dev/null || [ -x /home/node/.npm-global/bin/pm2 ]; then
    PM2=$(command -v pm2 || echo /home/node/.npm-global/bin/pm2)
    $PM2 delete all 2>/dev/null
    $PM2 start ecosystem.config.js
    $PM2 save
else
    node server.js &
fi