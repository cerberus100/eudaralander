# 🚀 EC2 Deployment Guide for Eudaura

## 📋 Quick Setup (Production-Ready)

### 1. **Launch EC2 Instance**
```bash
# Recommended: t3.small (2 vCPU, 2GB RAM)
# AMI: Amazon Linux 2023 or Ubuntu 22.04
# Security Group: 
#   - Port 22 (SSH) - Your IP only
#   - Port 80 (HTTP) - 0.0.0.0/0
#   - Port 443 (HTTPS) - 0.0.0.0/0
```

### 2. **Initial Server Setup**
```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Update system
sudo yum update -y  # Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx  # Amazon Linux
# or
sudo apt install -y nginx  # Ubuntu

# Install Git
sudo yum install -y git
```

### 3. **Application Setup**
```bash
# Create app directory
sudo mkdir -p /var/www/eudaura
sudo chown ec2-user:ec2-user /var/www/eudaura

# Clone repository
cd /var/www
git clone https://github.com/cerberus100/eudaralander.git eudaura
cd eudaura/eudaura-site

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
EUDAURA_AWS_REGION=us-east-1
EUDAURA_AWS_ACCESS_KEY_ID=your-key
EUDAURA_AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=eudaura-documents
SEED_ADMIN_EMAIL=admin@eudaura.com
EUDAURA_FROM_EMAIL=noreply@eudaura.com
MAIN_APP_URL=https://app.eudaura.com
MAIN_APP_API_URL=https://api.eudaura.com
NODE_ENV=production
EOF

# Build the application
npm run build
```

### 4. **PM2 Configuration**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'eudaura-site',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/eudaura/eudaura-site',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/eudaura-error.log',
    out_file: '/var/log/pm2/eudaura-out.log',
    log_file: '/var/log/pm2/eudaura-combined.log',
    time: true
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. **Nginx Configuration**
```bash
# Create Nginx config
sudo cat > /etc/nginx/conf.d/eudaura.conf << 'EOF'
server {
    listen 80;
    server_name eudaura.com www.eudaura.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eudaura.com www.eudaura.com;

    # SSL configuration (after setting up Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/eudaura.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eudaura.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### 6. **SSL Setup with Let's Encrypt**
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# or
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu

# Get SSL certificate
sudo certbot --nginx -d eudaura.com -d www.eudaura.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 7. **Deployment Script**
```bash
# Create deploy script
cat > /home/ec2-user/deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/eudaura/eudaura-site

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2
pm2 restart eudaura-site

echo "Deployment complete!"
EOF

chmod +x /home/ec2-user/deploy.sh
```

### 8. **GitHub Webhook (Optional)**
```bash
# Install webhook listener
npm install -g github-webhook-handler

# Create webhook server
cat > /home/ec2-user/webhook.js << 'EOF'
const http = require('http');
const createHandler = require('github-webhook-handler');
const handler = createHandler({ path: '/webhook', secret: 'your-webhook-secret' });
const { exec } = require('child_process');

http.createServer((req, res) => {
  handler(req, res, (err) => {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('push', (event) => {
  if (event.payload.ref === 'refs/heads/main') {
    exec('/home/ec2-user/deploy.sh', (err, stdout, stderr) => {
      if (err) console.error('Deploy error:', err);
      console.log('Deploy output:', stdout);
    });
  }
});
EOF

# Start webhook server with PM2
pm2 start /home/ec2-user/webhook.js --name github-webhook
pm2 save
```

## 📊 Cost Comparison

### **Current Amplify Costs:**
- Hosting: $0.15/GB served
- Build minutes: $0.01/minute after 1000 free
- ~$12-15/month for typical usage

### **EC2 Costs:**
- t3.small instance: ~$15/month (1 year reserved)
- EBS storage (30GB): ~$3/month
- Data transfer: First 100GB free
- **Total: ~$18-20/month**

## 🚀 Benefits of EC2

1. **Instant Deployments** - Just pull and restart
2. **No Build Limits** - Deploy 100 times a day
3. **Full Control** - Custom Node versions, system packages
4. **Better Debugging** - SSH access to logs
5. **Background Jobs** - Can run cron jobs, workers
6. **WebSockets** - Full support if needed

## ⚠️ Considerations

1. **Maintenance** - You manage OS updates
2. **Monitoring** - Set up CloudWatch alarms
3. **Backups** - Configure EBS snapshots
4. **Scaling** - Manual or use Auto Scaling Groups

## 🎯 Recommendation

For Eudaura, EC2 makes sense because:
- ✅ Frequent updates during development
- ✅ Need for quick iterations
- ✅ Cost is predictable
- ✅ Full control over environment
- ✅ Can run additional services (Redis, background jobs)

## 📝 Migration Checklist

- [ ] Launch EC2 instance
- [ ] Set up security groups
- [ ] Install Node.js, PM2, Nginx
- [ ] Clone repository
- [ ] Configure environment variables
- [ ] Set up SSL with Let's Encrypt
- [ ] Configure PM2 for auto-restart
- [ ] Set up deployment script
- [ ] Update DNS to point to EC2
- [ ] Monitor for 24 hours
- [ ] Shut down Amplify app
