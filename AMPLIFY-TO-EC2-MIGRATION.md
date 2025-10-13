# 🚀 Amplify to EC2 Migration Guide

## 📋 Migration Overview

This guide will help you migrate from AWS Amplify to EC2 with zero downtime.

**Time Required**: ~30-45 minutes  
**Downtime**: Zero (using DNS switchover)  
**Cost**: ~$18-20/month (vs ~$15/month for Amplify)

## 📊 Pre-Migration Checklist

- [ ] AWS CLI installed and configured
- [ ] EC2 key pair created in us-east-1
- [ ] Domain registrar login (for DNS updates)
- [ ] AWS credentials from `.env.local`

## 🛠️ Step 1: Launch EC2 Infrastructure (5 minutes)

### Option A: Using CloudFormation (Recommended)

```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name eudaura-ec2 \
  --template-body file://deploy/cloudformation-ec2.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=YourIPAddress,ParameterValue=$(curl -s ifconfig.me)/32 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name eudaura-ec2 \
  --region us-east-1

# Get the public IP
aws cloudformation describe-stacks \
  --stack-name eudaura-ec2 \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
  --output text \
  --region us-east-1
```

### Option B: Manual EC2 Launch

1. Go to EC2 Console
2. Launch Instance:
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: t3.small
   - **Key Pair**: Select your existing key
   - **Security Group**: Create new with ports 22, 80, 443
   - **Storage**: 30GB gp3
   - **User Data**: Copy from `deploy/ec2-user-data.sh`

## 🔧 Step 2: Configure the Server (15 minutes)

```bash
# SSH into the instance
ssh -i your-key.pem ec2-user@YOUR-EC2-IP

# Run the setup script
curl -sSL https://raw.githubusercontent.com/cerberus100/eudaralander/main/eudaura-site/deploy/setup-ec2.sh -o setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

## 🔐 Step 3: Configure Environment Variables

```bash
# Edit the environment file
nano /var/www/eudaura/eudaura-site/.env.local

# Add your actual AWS credentials:
EUDAURA_AWS_ACCESS_KEY_ID=your-actual-key
EUDAURA_AWS_SECRET_ACCESS_KEY=your-actual-secret

# Save and exit (Ctrl+X, Y, Enter)

# Rebuild the application
cd /var/www/eudaura/eudaura-site
npm run build

# Restart PM2
pm2 restart eudaura-site
```

## 🔒 Step 4: Install SSL Certificate (5 minutes)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate (make sure DNS is pointing to EC2 first!)
sudo certbot --nginx -d eudaura.com -d www.eudaura.com \
  --email admin@eudaura.com \
  --agree-tos \
  --no-eff-email

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🌐 Step 5: Update DNS (5 minutes)

1. **Get your EC2 Elastic IP**:
   ```bash
   curl -s ifconfig.me  # Run this on EC2
   ```

2. **Update DNS Records**:
   - **A Record**: `eudaura.com` → Your EC2 IP
   - **A Record**: `www.eudaura.com` → Your EC2 IP
   - **Remove**: CNAME records pointing to Amplify

3. **DNS Propagation**: Wait 5-30 minutes

## ✅ Step 6: Verify Everything Works

```bash
# On EC2 - Check application status
pm2 status
pm2 logs eudaura-site --lines 50

# Health check
curl http://localhost:3000/api/test

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# From your local machine - Test the site
curl -I https://eudaura.com
```

## 🔄 Step 7: Set Up Continuous Deployment

### Option A: Manual Deploy Script

```bash
# On EC2 - Deploy updates
cd /home/ec2-user
./deploy-eudaura.sh
```

### Option B: GitHub Webhook (Automated)

```bash
# On EC2 - Install webhook handler
cd /home/ec2-user
npm install github-webhook-handler

# Create webhook server
cat > webhook-server.js << 'EOF'
const http = require('http');
const createHandler = require('github-webhook-handler');
const handler = createHandler({ path: '/webhook', secret: 'your-secret-here' });
const { exec } = require('child_process');

http.createServer((req, res) => {
  handler(req, res, (err) => {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('push', (event) => {
  if (event.payload.ref === 'refs/heads/main') {
    console.log('Deploying main branch...');
    exec('/home/ec2-user/deploy-eudaura.sh', (err, stdout, stderr) => {
      if (err) console.error('Deploy error:', err);
      console.log('Deploy output:', stdout);
    });
  }
});

console.log('Webhook server listening on port 7777');
EOF

# Start with PM2
pm2 start webhook-server.js --name github-webhook
pm2 save

# Add to Nginx config
sudo nano /etc/nginx/conf.d/eudaura.conf
# Add this location block:
#   location /webhook {
#     proxy_pass http://localhost:7777;
#   }

sudo nginx -t && sudo systemctl reload nginx

# In GitHub repo settings:
# Add webhook: https://eudaura.com/webhook
# Secret: your-secret-here
# Events: Just the push event
```

## 🗑️ Step 8: Decommission Amplify (After Verification)

**Wait 24-48 hours** to ensure everything is stable, then:

```bash
# Delete Amplify app
aws amplify delete-app \
  --app-id YOUR-AMPLIFY-APP-ID \
  --region us-east-1
```

## 📊 Monitoring & Maintenance

### Daily Tasks
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs eudaura-site`

### Weekly Tasks
- OS updates: `sudo yum update -y`
- Check disk space: `df -h`
- Review Nginx logs: `sudo tail -f /var/log/nginx/access.log`

### Monthly Tasks
- SSL renewal check: `sudo certbot renew --dry-run`
- Security updates: `sudo yum update --security`
- Backup `.env.local`: `cp /var/www/eudaura/eudaura-site/.env.local ~/env-backup-$(date +%Y%m%d)`

## 🚨 Troubleshooting

### Site Not Loading
```bash
# Check PM2
pm2 status
pm2 restart eudaura-site

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx

# Check logs
pm2 logs eudaura-site --lines 100
sudo tail -f /var/log/nginx/error.log
```

### High CPU/Memory
```bash
# Check resources
top
pm2 monit

# Restart if needed
pm2 restart eudaura-site
```

### SSL Issues
```bash
# Renew manually
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates
```

## 🎯 Benefits Achieved

✅ **Instant Deployments** - No more 5-8 minute builds  
✅ **Full Control** - SSH access, custom configs  
✅ **Cost Predictable** - Fixed monthly cost  
✅ **Better Debugging** - Real-time logs  
✅ **No Build Limits** - Deploy 100x per day  

## 📞 Emergency Rollback

If something goes wrong:

1. **Quick Fix**: Update DNS back to Amplify
2. **Amplify domain**: `main.d28ow29ha3x2t5.amplifyapp.com`
3. **DNS will propagate in 5-30 minutes**

---

**Questions?** Check the logs first:
- PM2 logs: `pm2 logs eudaura-site`
- Nginx logs: `/var/log/nginx/error.log`
- User data log: `/var/log/user-data.log`
