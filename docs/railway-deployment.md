# AI Novel Generator - Railway Deployment Guide

## Overview
This application is designed to deploy to Railway.app with three services:
- **Web Service**: FastAPI backend API
- **Worker Service**: Celery workers for background generation tasks
- **Frontend**: React application (or served via Railway static site)

Railway also provides managed Redis and PostgreSQL, but we use external MongoDB Atlas.

## Prerequisites
1. Railway account: https://railway.app
2. MongoDB Atlas cluster: https://www.mongodb.com/cloud/atlas
3. OpenAI API key: https://platform.openai.com/api-keys
4. Anthropic API key: https://console.anthropic.com/

## Railway Project Setup

### 1. Create New Project
```bash
railway login
railway init
```

### 2. Add Services

#### Service 1: API (Web)
- **Name**: `ai-novel-api`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Root Directory**: `/`
- **Public Domain**: Enable (Railway will provide a URL)

#### Service 2: Worker
- **Name**: `ai-novel-worker`
- **Start Command**: `celery -A backend.workers.celery_app worker --loglevel=info`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Root Directory**: `/`
- **Public Domain**: Disable

#### Service 3: Frontend (Optional - can use Netlify/Vercel instead)
- **Name**: `ai-novel-frontend`
- **Start Command**: `npm run preview` (after build)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Root Directory**: `/frontend`
- **Public Domain**: Enable

### 3. Add Redis Service
Railway provides Redis as a plugin:
```bash
railway add redis
```
This auto-populates `REDIS_URL` variable.

### 4. Environment Variables

Set these in Railway dashboard for **both API and Worker services**:

```env
# Application
ENVIRONMENT=production
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-frontend-domain.railway.app

# Security (REQUIRED - Authentication)
SECRET_KEY=generate-random-32-char-string
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=ai_novel_generator

# Redis (auto-populated by Railway Redis plugin - Optional for workers)
REDIS_URI=${{Redis.REDIS_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}/0
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}/1

# AI Keys (REQUIRED)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# AI Defaults
DEFAULT_MODEL_PROVIDER=anthropic
DEFAULT_MODEL_NAME=claude-sonnet-4-20250514
DEFAULT_TEMPERATURE=0.8
DEFAULT_MAX_TOKENS=4096

# Web Search (Optional - for chat search feature)
TAVILY_API_KEY=tvly-...

# Feature Flags
BOOK_COVERS_ENABLED=true

# Generation Limits
MAX_PREMISE_WORDS=5000
MAX_CHAPTER_COUNT=100
MAX_WORD_COUNT_PER_BOOK=250000
SUMMARIZATION_THRESHOLD=5
CONTEXT_WINDOW_CHAPTERS=5
```

**To generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Variable References**: Railway supports `${{ServiceName.VAR}}` syntax for cross-service references.

### 5. MongoDB Atlas Setup
1. Create cluster at https://cloud.mongodb.com
2. Add Railway IP ranges to Network Access (or allow all: `0.0.0.0/0`)
3. Create database user
4. Get connection string and add to Railway env vars

### 6. Deploy
```bash
# Deploy from CLI
railway up

# Or connect GitHub repo for auto-deploys
railway link
```

## Health Checks
Railway will automatically use:
- **Health Check Path**: `/api/health`
- **Expected Status**: 200

## Logs & Monitoring
```bash
# View logs
railway logs

# Follow logs in real-time
railway logs --follow
```

Access Railway dashboard for metrics, CPU/memory usage, and deploy history.

## Scaling
- **API Service**: Scale horizontally via Railway dashboard (increase replicas)
- **Worker Service**: Scale horizontally (multiple worker instances)
- **Redis**: Managed by Railway, auto-scales

## Cost Estimates
- **Railway**: ~$20-50/month (Hobby plan for API + Worker + Redis)
- **MongoDB Atlas**: Free tier (512 MB) or $9+/month for dedicated
- **AI APIs**: Variable based on usage
  - GPT-4: ~$0.03-0.06 per 1k tokens
  - Claude Sonnet: ~$0.003-0.015 per 1k tokens
  - Generating a 50k word novel: ~$5-20 depending on model

## Troubleshooting

### Worker not picking up tasks
- Check Redis connection in worker logs
- Verify `CELERY_BROKER_URL` matches between API and Worker
- Restart worker service

### Database connection timeout
- Verify MongoDB Atlas network access rules
- Check `MONGODB_URI` format
- Ensure database user has correct permissions

### High memory usage
- Reduce `maxPoolSize` in MongoDB connection
- Scale up Railway service (increase RAM)
- Optimize context window size for generation

## Production Checklist
- [ ] **SECRET_KEY generated** (use `secrets.token_urlsafe(32)`)
- [ ] MongoDB backups configured
- [ ] Railway project has payment method (avoid service suspension)
- [ ] **Required API keys set**: OPENAI_API_KEY, ANTHROPIC_API_KEY
- [ ] Optional: TAVILY_API_KEY for web search feature
- [ ] CORS origins restricted to production domains
- [ ] Frontend VITE_API_URL points to Railway backend
- [ ] Health check endpoint verified at `/api/health`
- [ ] Database indexes created (auto-created on first connection)
- [ ] Test authentication flow (register → login → protected routes)
- [ ] Test novel generation pipeline (premise → story bible → outline → chapters)

## Rollback
Railway keeps deployment history:
```bash
# Rollback to previous deployment
railway rollback
```

Or use Railway dashboard to select a previous deployment and redeploy.

## Local Testing of Railway Config
Use Railway CLI to run locally with production env vars:
```bash
railway run python backend/main.py
```

This pulls Railway environment variables into your local process.
