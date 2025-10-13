#!/bin/bash
# EC2 User Data Script - Runs automatically on instance launch
# Use this when launching EC2 instance to automate initial setup

# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "🚀 Starting automated Eudaura setup at $(date)"

# Wait for instance to be ready
sleep 30

# Create setup user
useradd -m -s /bin/bash eudaura || echo "User already exists"

# Download and run setup script
cd /home/eudaura
curl -sSL https://raw.githubusercontent.com/cerberus100/eudaralander/main/eudaura-site/deploy/setup-ec2.sh -o setup-ec2.sh
chmod +x setup-ec2.sh

# Run setup as eudaura user
sudo -u eudaura ./setup-ec2.sh

echo "✅ User data script completed at $(date)"
