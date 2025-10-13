#!/bin/bash
# Eudaura Monitoring Dashboard
# Run this on EC2 to check system health

clear

echo "======================================"
echo "   EUDAURA SYSTEM HEALTH DASHBOARD"
echo "======================================"
echo "Time: $(date)"
echo ""

# System Resources
echo "📊 SYSTEM RESOURCES:"
echo "-------------------"
# CPU Usage
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU Usage: ${cpu_usage}%"

# Memory Usage
mem_info=$(free -m | awk 'NR==2{printf "Memory: %s/%sMB (%.2f%%)\n", $3,$2,$3*100/$2 }')
echo "$mem_info"

# Disk Usage
disk_usage=$(df -h / | awk 'NR==2{printf "Disk: %s/%s (%s)\n", $3, $2, $5}')
echo "$disk_usage"

echo ""

# Application Status
echo "🚀 APPLICATION STATUS:"
echo "---------------------"
# PM2 Status
pm2_status=$(pm2 status --no-color | grep "eudaura-site" | awk '{print $10}')
if [ "$pm2_status" == "online" ]; then
    echo "✅ PM2 Status: Online"
    pm2_info=$(pm2 info eudaura-site --no-color | grep -E "restarts|uptime")
    echo "$pm2_info" | sed 's/│//g' | sed 's/^[ \t]*/  /'
else
    echo "❌ PM2 Status: $pm2_status"
fi

# Health Check
echo ""
echo "Testing health endpoint..."
health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/test)
if [ "$health_response" -eq 200 ]; then
    echo "✅ Health Check: Passed (HTTP $health_response)"
else
    echo "❌ Health Check: Failed (HTTP $health_response)"
fi

echo ""

# Nginx Status
echo "🌐 WEB SERVER STATUS:"
echo "--------------------"
nginx_status=$(systemctl is-active nginx)
if [ "$nginx_status" == "active" ]; then
    echo "✅ Nginx: Active"
    # Count active connections
    connections=$(ss -tun | grep -c ":443")
    echo "   Active HTTPS connections: $connections"
else
    echo "❌ Nginx: $nginx_status"
fi

echo ""

# Recent Errors
echo "⚠️  RECENT ERRORS (Last 10):"
echo "-------------------------"
echo "PM2 Errors:"
pm2 logs eudaura-site --err --nostream --lines 5 2>/dev/null | tail -5 | sed 's/^/  /'

echo ""
echo "Nginx Errors:"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null | sed 's/^/  /'

echo ""

# Recent Deployments
echo "📦 RECENT DEPLOYMENTS:"
echo "--------------------"
if [ -f /home/ec2-user/deploy-eudaura.sh ]; then
    last_deploy=$(stat -c %y /var/www/eudaura/eudaura-site/.next/BUILD_ID 2>/dev/null || echo "Never")
    echo "Last deployment: $last_deploy"
    
    # Git status
    cd /var/www/eudaura/eudaura-site 2>/dev/null
    current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    last_commit=$(git log -1 --pretty=format:"%h - %s (%cr)" 2>/dev/null || echo "unknown")
    echo "Current branch: $current_branch"
    echo "Last commit: $last_commit"
fi

echo ""

# SSL Certificate
echo "🔒 SSL CERTIFICATE:"
echo "------------------"
cert_expiry=$(sudo certbot certificates 2>/dev/null | grep "Expiry Date:" | head -1 | awk '{print $3, $4}')
if [ -n "$cert_expiry" ]; then
    echo "Certificate expires: $cert_expiry"
    # Check if expiring soon
    expiry_epoch=$(date -d "$cert_expiry" +%s 2>/dev/null || echo 0)
    current_epoch=$(date +%s)
    days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    if [ $days_left -lt 30 ] && [ $days_left -gt 0 ]; then
        echo "⚠️  Certificate expires in $days_left days!"
    elif [ $days_left -le 0 ]; then
        echo "❌ Certificate expired!"
    else
        echo "✅ Certificate valid for $days_left days"
    fi
else
    echo "No SSL certificate found"
fi

echo ""
echo "======================================"
echo "Press Ctrl+C to exit"

# Optional: Auto-refresh every 5 seconds
# while true; do
#     sleep 5
#     clear
#     $0
# done
