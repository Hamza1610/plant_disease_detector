#!/bin/bash
# Omnivax Master Deployment Script for Ubuntu EC2
set -e

echo "=========================================="
echo "   Omnivax Backend Master Setup Init      "
echo "=========================================="

# 1. System Dependencies
echo ">>> Installing System Dependencies..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release sqlite3

# 2. Docker & Compose Plugin
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker Engine..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "!!! Docker installed. You may need to restart your session after this script finishes."
fi

# 3. Directory & Permissions
echo ">>> Preparing Workspace..."
mkdir -p data backups
sudo chown -R $USER:$USER .

# 4. Interactive .env Generation
if [ ! -f .env ]; then
    echo ">>> Configuration Required: Generating .env..."
    read -p "Enter your Public EC2 IP: " PUBLIC_IP
    read -p "Enter your Email (for SSL): " EMAIL
    read -p "Enter Gemini API Key: " GEMINI_KEY
    
    cat <<EOF > .env
DOMAIN_NAME=$PUBLIC_IP
SSL_EMAIL=$EMAIL
SECRET_KEY=$(openssl rand -hex 32)
GEMINI_API_KEY=$GEMINI_KEY
DATABASE_URL=sqlite:////app/data/plant_disease.db
EOF
    echo ">>> .env generated successfully."
fi

# 5. Build and Launch
echo ">>> Building Containers (Multi-stage + CPU Torch Optimization)..."
sudo docker compose build
sudo docker compose up -d

# 6. Automated Backup Setup
echo ">>> Configuring Nightly Backups..."
chmod +x scripts/backup-db.sh
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup-db.sh") | crontab -

echo "=========================================="
echo "   DEPLOYMENT SUCCESSFUL!                 "
echo "   API: https://$PUBLIC_IP.sslip.io/health"
echo "=========================================="
echo "NOTE: If you get a permission error, log out and back in to refresh Docker groups."
