# Deployment Guide

## Overview

FibonroseTrust uses a multi-platform deployment strategy:
- **Backend (Express)**: Google Cloud Run
- **Frontend (React/Vite)**: Vercel
- **Database**: Neon PostgreSQL (serverless)

## Architecture

```
┌─────────────┐
│   Vercel    │  ← Frontend (React/Vite)
│  (Frontend) │
└──────┬──────┘
       │
       │ API Calls
       │
┌──────▼──────┐
│ Cloud Run   │  ← Backend (Express/TypeScript)
│  (Backend)  │
└──────┬──────┘
       │
       │ Database
       │
┌──────▼──────┐
│    Neon     │  ← PostgreSQL Database
│  PostgreSQL │
└─────────────┘
```

## Prerequisites

### Tools Required
- Node.js 20.x or later
- npm or yarn
- Google Cloud SDK (`gcloud`)
- Vercel CLI
- Docker (for Cloud Run deployment)

### Accounts Required
- Google Cloud Platform account
- Vercel account
- GitHub account (for CI/CD)

## Environment Setup

### 1. Development Environment

Create a `.env.development` file:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fibonrose_dev

# Auth0
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:5000
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com

# Persona
PERSONA_API_KEY=your_sandbox_api_key
PERSONA_ENVIRONMENT=sandbox
PERSONA_TEMPLATE_ID=your_template_id
PERSONA_WEBHOOK_SECRET=your_webhook_secret

# Other Services
GCP_PROJECT_ID=your_project_id
```

### 2. Production Environment

Create a `.env.production` file with production credentials.

## Backend Deployment (Google Cloud Run)

### Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (if needed)
gcloud projects create fibonrose-prod --name="FibonroseTrust Production"

# Set the project
gcloud config set project fibonrose-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Step 2: Build Docker Image

```bash
# Build the Docker image
docker build -t gcr.io/fibonrose-prod/fibonrose-backend:latest .

# Test locally
docker run -p 8080:8080 \
  -e DATABASE_URL="your_db_url" \
  -e NODE_ENV=production \
  gcr.io/fibonrose-prod/fibonrose-backend:latest
```

### Step 3: Push to Google Container Registry

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Push the image
docker push gcr.io/fibonrose-prod/fibonrose-backend:latest
```

### Step 4: Deploy to Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy fibonrose-backend \
  --image gcr.io/fibonrose-prod/fibonrose-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DATABASE_URL="your_db_url" \
  --set-env-vars AUTH0_SECRET="your_secret" \
  --set-env-vars PERSONA_API_KEY="your_key" \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300

# Get the service URL
gcloud run services describe fibonrose-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

### Step 5: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service fibonrose-backend \
  --domain api.fibonrosetrust.com \
  --region us-central1
```

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel@latest
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Project

Create a `vercel.json` file (already created in the repository):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Step 4: Deploy to Vercel

```bash
# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 5: Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add the following:
   - `VITE_API_URL`: Your Cloud Run backend URL
   - `VITE_AUTH0_DOMAIN`: Your Auth0 domain
   - `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID
   - `VITE_PERSONA_ENVIRONMENT`: sandbox or production

### Step 6: Configure Custom Domain

In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add your custom domain: `app.fibonrosetrust.com`
3. Configure DNS records as instructed

## Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Project

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Note your connection string

### Step 2: Run Migrations

```bash
# Push database schema
npm run db:push

# Or run migrations
npx drizzle-kit push:pg
```

## CI/CD Setup (GitHub Actions)

### Step 1: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

**For Development:**
- `GCP_SA_KEY`: Service account key JSON (base64 encoded)
- `GCP_PROJECT_ID`: Your GCP project ID
- `VERCEL_TOKEN`: Your Vercel API token
- `CODECOV_TOKEN`: (Optional) For code coverage
- `SNYK_TOKEN`: (Optional) For security scanning

**For Production:**
Same as development, with production credentials

### Step 2: Configure Branches

The CI/CD workflows are configured for:
- `main`: Production deployments
- `develop`: Staging deployments
- `dev`: Development deployments

### Step 3: Trigger Deployment

```bash
# Deploy to dev
git checkout dev
git commit -m "Deploy to dev"
git push origin dev

# Deploy to staging
git checkout develop
git merge dev
git push origin develop

# Deploy to production
git checkout main
git merge develop
git push origin main
```

## Monitoring and Logging

### Cloud Run Logs

```bash
# View logs
gcloud run services logs read fibonrose-backend \
  --region us-central1 \
  --limit 50 \
  --format json

# Stream logs
gcloud run services logs tail fibonrose-backend \
  --region us-central1
```

### Vercel Logs

Access logs through Vercel Dashboard → Project → Logs

## Scaling Configuration

### Cloud Run Auto-scaling

```bash
# Update scaling settings
gcloud run services update fibonrose-backend \
  --min-instances 1 \
  --max-instances 20 \
  --concurrency 80 \
  --cpu-throttling \
  --region us-central1
```

### Cost Optimization

1. **Cloud Run**: Set minimum instances to 0 for dev/staging
2. **Vercel**: Use preview deployments for testing
3. **Database**: Use Neon's autoscaling feature

## Health Checks

### Backend Health Check

```bash
curl https://your-backend-url/health
```

### Frontend Health Check

```bash
curl https://your-frontend-url
```

## Rollback Procedures

### Cloud Run Rollback

```bash
# List revisions
gcloud run revisions list \
  --service fibonrose-backend \
  --region us-central1

# Rollback to previous revision
gcloud run services update-traffic fibonrose-backend \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

### Vercel Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

## Troubleshooting

### Common Issues

**Backend not starting:**
- Check environment variables
- Verify database connection
- Review Cloud Run logs

**Frontend API calls failing:**
- Verify VITE_API_URL is correct
- Check CORS configuration
- Ensure backend is running

**Database connection issues:**
- Verify connection string
- Check IP allowlist in Neon
- Test connection locally

### Support

For deployment issues:
- Check GitHub Actions logs
- Review Cloud Run logs
- Contact DevOps team

## Security Checklist

- [ ] All secrets stored in environment variables
- [ ] HTTPS enforced on all domains
- [ ] Database SSL connections enabled
- [ ] API authentication configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Webhook signatures verified

## Performance Optimization

1. **CDN**: Vercel automatically provides CDN for frontend
2. **Caching**: Configure Cloud Run cache headers
3. **Database**: Use connection pooling with Neon
4. **Images**: Use Vercel Image Optimization
5. **Code Splitting**: Enabled by Vite by default

## Backup Strategy

1. **Database**: Neon automatic backups (7-day retention)
2. **Code**: GitHub repository backups
3. **Secrets**: Store encrypted backups in secure location

## Cost Estimation

**Monthly costs (approximate):**
- Cloud Run: $0-50 (depending on traffic)
- Vercel: $0 (Hobby) or $20+ (Pro)
- Neon: $0 (Free tier) or $19+ (Pro)
- **Total**: $0-100+ per month

## Next Steps

After deployment:
1. Setup monitoring and alerts
2. Configure custom domains
3. Enable CDN
4. Setup backup procedures
5. Document runbooks
6. Train team on deployment process
