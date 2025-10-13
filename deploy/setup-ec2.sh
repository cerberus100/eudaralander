#!/bin/bash
# EC2 Setup Script for Eudaura Landing Page
# Run this on a fresh EC2 instance (Amazon Linux 2023 or Ubuntu 22.04)

set -e  # Exit on error

echo "🚀 Starting Eudaura EC2 Setup..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Cannot detect OS"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
if [ "$OS" == "amzn" ]; then
    sudo yum update -y
    INSTALL_CMD="sudo yum install -y"
elif [ "$OS" == "ubuntu" ]; then
    sudo apt update && sudo apt upgrade -y
    INSTALL_CMD="sudo apt install -y"
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
$INSTALL_CMD nodejs

# Install essential packages
echo "📦 Installing essential packages..."
$INSTALL_CMD git nginx
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/eudaura
sudo chown $USER:$USER /var/www/eudaura

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Clone repository
echo "📥 Cloning repository..."
cd /var/www
if [ -d "eudaura" ]; then
    echo "Repository already exists, pulling latest..."
    cd eudaura
    git pull origin main
else
    git clone https://github.com/cerberus100/eudaralander.git eudaura
    cd eudaura
fi

cd eudaura-site

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file
echo "🔐 Creating environment file..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
# AWS Configuration
EUDAURA_AWS_REGION=us-east-1
EUDAURA_AWS_ACCESS_KEY_ID=YOUR_KEY_HERE
EUDAURA_AWS_SECRET_ACCESS_KEY=YOUR_SECRET_HERE

# S3 Configuration
S3_BUCKET_NAME=eudaura-documents

# Email Configuration
SEED_ADMIN_EMAIL=admin@eudaura.com
EUDAURA_FROM_EMAIL=noreply@eudaura.com

# App URLs
MAIN_APP_URL=https://app.eudaura.com
MAIN_APP_API_URL=https://api.eudaura.com

# Environment
NODE_ENV=production
EOF
    echo "⚠️  Please edit /var/www/eudaura/eudaura-site/.env.local with your actual AWS credentials!"
fi

# Build application
echo "🔨 Building application..."
npm run build

# Create PM2 ecosystem file
echo "⚙️  Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'eudaura-site',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/eudaura/eudaura-site',
    instances: 1,
    exec_mode: 'fork',
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
    time: true,
    merge_logs: true
  }]
};
EOF

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 delete eudaura-site 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
echo "⚙️  Setting up PM2 startup..."
if [ "$OS" == "amzn" ]; then
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
elif [ "$OS" == "ubuntu" ]; then
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
fi

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/conf.d/eudaura.conf > /dev/null << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# Upstream
upstream eudaura_app {
    server localhost:3000;
    keepalive 64;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name eudaura.com www.eudaura.com;
    
    # Allow Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server (will be active after SSL setup)
server {
    listen 443 ssl http2;
    server_name eudaura.com www.eudaura.com;
    
    # SSL will be configured by certbot
    # ssl_certificate /etc/letsencrypt/live/eudaura.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/eudaura.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://eudaura_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API routes with higher rate limit
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://eudaura_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets caching
    location /_next/static {
        proxy_pass http://eudaura_app;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
    
    location /images {
        proxy_pass http://eudaura_app;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600";
    }
}
EOF

# Test and enable Nginx
echo "✅ Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Restarting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Create deployment script
echo "📝 Creating deployment script..."
cat > /home/$USER/deploy-eudaura.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying Eudaura updates..."

cd /var/www/eudaura/eudaura-site

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies if package.json changed
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build application
echo "🔨 Building application..."
npm run build

# Reload application with zero downtime
echo "🔄 Reloading application..."
pm2 reload eudaura-site

echo "✅ Deployment complete!"
echo "📊 PM2 Status:"
pm2 status
EOF

chmod +x /home/$USER/deploy-eudaura.sh

# Create health check endpoint script
echo "📝 Creating health check script..."
cat > /home/$USER/health-check.sh << 'EOF'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/test)
if [ $response -eq 200 ]; then
    echo "✅ Health check passed"
    exit 0
else
    echo "❌ Health check failed with status: $response"
    exit 1
fi
EOF

chmod +x /home/$USER/health-check.sh

echo "
✅ EC2 setup complete!

📋 Next steps:
1. Edit environment variables: nano /var/www/eudaura/eudaura-site/.env.local
2. Install SSL certificate: sudo certbot --nginx -d eudaura.com -d www.eudaura.com
3. Update DNS records to point to this EC2 instance
4. Test deployment: ./deploy-eudaura.sh

📊 Useful commands:
- View logs: pm2 logs eudaura-site
- Monitor app: pm2 monit
- Restart app: pm2 restart eudaura-site
- Deploy updates: ./deploy-eudaura.sh
- Health check: ./health-check.sh

🌐 Once DNS is updated, your site will be available at:
- http://YOUR-EC2-IP:80 (will redirect to HTTPS after SSL setup)
"
