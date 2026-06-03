# FibonRoseTrust Infrastructure Migration Guide

This document provides comprehensive instructions for migrating from external cloud services (Google AI, Vercel, Replit) to self-managed infrastructure using GitHub Actions, Nginx, and Local AI.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Migration Steps](#migration-steps)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Nginx Configuration](#nginx-configuration)
6. [Local AI Setup](#local-ai-setup)
7. [Database Migration](#database-migration)
8. [Testing & Validation](#testing--validation)
9. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Previous Infrastructure
- **Hosting**: Vercel, Replit
- **AI Services**: Google AI, OpenAI API
- **Database**: Supabase (PostgreSQL)
- **External APIs**: Xano, Google Sheets

### New Infrastructure
- **Hosting**: Self-managed VPS with Nginx
- **CI/CD**: GitHub Actions
- **AI Services**: Local AI (self-hosted)
- **Database**: PostgreSQL (self-managed)
- **APIs**: Native REST APIs

### Benefits of Migration
- **Cost Reduction**: ~60-80% reduction in operational costs
- **Data Privacy**: Full control over data storage and processing
- **Performance**: Reduced latency with local AI inference
- **Independence**: No vendor lock-in

---

## Architecture Changes

### Before Migration
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│    Vercel    │────▶│  Google AI  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Supabase   │
                    └──────────────┘
```

### After Migration
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│    Nginx     │────▶│  Local AI   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │GitHub Actions│
                    └──────────────┘
```

---

## Migration Steps

### Phase 1: Infrastructure Setup (Week 1-2)

#### 1.1 Server Provisioning
```bash
# Example: Ubuntu 22.04 LTS VPS
# Minimum requirements: 4 vCPU, 8GB RAM, 100GB SSD

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql nodejs npm python3 python3-pip

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 1.2 SSL Certificate Setup
```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d fibonrosetrust.com -d www.fibonrosetrust.com
```

### Phase 2: Application Deployment (Week 2-3)

#### 2.1 Clone and Build
```bash
# Clone repository
git clone https://github.com/pinkycollie/FibonRoseTrust.git
cd FibonRoseTrust

# Install dependencies
npm ci

# Build application
npm run build
```

#### 2.2 Process Manager Setup
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start dist/index.js --name fibonrosetrust

# Enable startup on boot
pm2 startup
pm2 save
```

### Phase 3: AI Services Migration (Week 3-4)

#### 3.1 Local AI Installation
See [Local AI Setup](#local-ai-setup) section for detailed instructions.

#### 3.2 Model Configuration
```yaml
# config/ai-models.yaml
models:
  - name: trust-scoring
    type: classification
    endpoint: http://localhost:8080/v1/embeddings
    
  - name: semantic-matching
    type: embedding
    endpoint: http://localhost:8080/v1/embeddings
    
  - name: caption-generation
    type: text-generation
    endpoint: http://localhost:8080/v1/completions
```

---

## GitHub Actions Setup

### Required Secrets

Configure these secrets in your GitHub repository settings:

| Secret Name | Description |
|-------------|-------------|
| `STAGING_SSH_KEY` | SSH private key for staging server |
| `STAGING_HOST` | Staging server hostname/IP |
| `STAGING_USER` | SSH username for staging |
| `PRODUCTION_SSH_KEY` | SSH private key for production |
| `PRODUCTION_HOST` | Production server hostname/IP |
| `PRODUCTION_USER` | SSH username for production |
| `CODECOV_TOKEN` | Codecov token for coverage reports |

### Workflow Files

The following workflows are included:

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Runs on every push and PR
   - Executes tests and type checking
   - Builds application
   - Uploads coverage reports

2. **`.github/workflows/deploy.yml`** - Deployment Pipeline
   - Deploys to staging/production
   - Supports manual triggers
   - Includes rollback capability

3. **`.github/workflows/local-ai.yml`** - AI Model Management
   - Daily model validation
   - Performance benchmarking
   - Model update checks

---

## Nginx Configuration

### Basic Configuration

Create `/etc/nginx/sites-available/fibonrosetrust`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name fibonrosetrust.com www.fibonrosetrust.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name fibonrosetrust.com www.fibonrosetrust.com;

    ssl_certificate /etc/letsencrypt/live/fibonrosetrust.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fibonrosetrust.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static {
        alias /var/www/fibonrosetrust/dist/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API rate limiting
    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/fibonrosetrust /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Local AI Setup

### Installation Options

#### Option 1: Docker-based (Recommended)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Run LocalAI container
docker run -d --name local-ai \
  -p 8080:8080 \
  -v /path/to/models:/models \
  localai/localai:latest
```

#### Option 2: Native Installation
```bash
# Download LocalAI binary
wget https://github.com/mudler/LocalAI/releases/download/v2.9.0/local-ai-linux-amd64 -O /usr/local/bin/local-ai
chmod +x /usr/local/bin/local-ai

# Create systemd service
sudo tee /etc/systemd/system/local-ai.service << 'EOF'
[Unit]
Description=LocalAI Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/lib/local-ai
ExecStart=/usr/local/bin/local-ai --models-path /var/lib/local-ai/models
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable local-ai
sudo systemctl start local-ai
```

### Model Configuration

```yaml
# /var/lib/local-ai/models/trust-scoring.yaml
name: trust-scoring
backend: llama-cpp
parameters:
  model: /models/llama-2-7b-chat.gguf
  context_size: 2048
  threads: 4
```

---

## Database Migration

### From Supabase to Self-Managed PostgreSQL

#### 1. Export Data
```bash
# Export from Supabase
pg_dump -h db.supabase.co -U postgres -d postgres > backup.sql
```

#### 2. Import to Local PostgreSQL
```bash
# Create database
sudo -u postgres createdb fibonrosetrust

# Import data
sudo -u postgres psql fibonrosetrust < backup.sql
```

#### 3. Update Application Configuration
```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/fibonrosetrust
```

---

## Testing & Validation

### Health Checks

```bash
# Check application
curl -f http://localhost:5000/api/health

# Check Nginx
curl -f https://fibonrosetrust.com/api/health

# Check Local AI
curl -f http://localhost:8080/v1/models
```

### Performance Testing

```bash
# Install wrk for load testing
sudo apt install wrk

# Run load test
wrk -t12 -c400 -d30s https://fibonrosetrust.com/api/health
```

---

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous deployment
cd /var/www/fibonrosetrust
git checkout HEAD~1
npm ci
pm2 restart fibonrosetrust
```

### Full Rollback

```bash
# Restore from backup
cd /var/www
rm -rf fibonrosetrust
tar -xzf /backups/fibonrosetrust-backup.tar.gz
cd fibonrosetrust
npm ci
pm2 restart fibonrosetrust
```

---

## Support & Troubleshooting

### Common Issues

1. **Nginx 502 Bad Gateway**: Check if Node.js application is running
2. **SSL Certificate Errors**: Renew certificate with `sudo certbot renew`
3. **AI Model Slow**: Increase threads in Local AI configuration
4. **Database Connection**: Verify PostgreSQL is running and credentials are correct

### Logs

```bash
# Application logs
pm2 logs fibonrosetrust

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u fibonrosetrust -f
```

---

## Conclusion

This migration guide provides a comprehensive path from cloud-dependent infrastructure to a fully self-managed environment. Follow each phase carefully and test thoroughly before moving to production.

For questions or issues, please open a GitHub issue in the FibonRoseTrust repository.
