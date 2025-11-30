# Deployment & Troubleshooting Guide

**For**: DevOps, System Administrators, Deployment Issues  
**Platform**: Railway (primary), General Python/FastAPI  
**Last Updated**: November 29, 2025

---

## Table of Contents

1. [Railway Deployment](#railway-deployment)
2. [Health Check Issues](#health-check-issues)
3. [Common Errors](#common-errors)
4. [Database Issues](#database-issues)
5. [API Key Problems](#api-key-problems)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Logging](#monitoring--logging)
8. [Rollback Procedures](#rollback-procedures)

---

## Railway Deployment

### Prerequisites
- Railway account with credit/plan
- GitHub repository connected
- Environment variables configured

### Initial Deployment

**Step 1: Create Railway Project**
```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login
railway login

# Link project
railway link
```

**Step 2: Configure Environment**

Navigate to Railway dashboard → Project → Variables:

```env
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_novel_generator
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
TAVILY_API_KEY=tvly-...
ENVIRONMENT=production
LOG_LEVEL=INFO
```

**Step 3: Deploy Backend**

Railway auto-deploys on git push:
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

**Step 4: Deploy Frontend**

```bash
cd frontend
npm run build
# Upload dist/ to CDN or Railway static hosting
```

### Deployment Checklist

- [ ] Environment variables set (all required keys)
- [ ] MongoDB Atlas IP whitelist includes Railway IPs (0.0.0.0/0 for simplicity)
- [ ] Health check endpoint responding (`/api/health`)
- [ ] CORS origins include frontend domain
- [ ] Logs show successful startup (no import errors)
- [ ] Test API call succeeds (`curl https://your-app.railway.app/api/health`)

---

## Health Check Issues

### Issue: "Health checks failing, service unavailable"

**Symptoms**:
- Railway dashboard shows "Health checks failing"
- Service restarts repeatedly
- 503 errors on all endpoints

**Diagnosis**:
```bash
# Check Railway logs
railway logs

# Look for:
# - Import errors
# - Syntax errors
# - MongoDB connection failures
# - Missing environment variables
```

**Common Causes & Solutions**:

#### Cause 1: Python Syntax Error (FIXED Nov 29, 2025)

**Example**: `SyntaxError: unterminated triple-quoted string literal`

**Location**: `backend/services/story_bible_service.py:333`

**Root Cause**: Accidental `"""` closing f-string prematurely on line 69

**Fix Applied**:
```python
# BEFORE (BROKEN):
return f"""Generate a comprehensive Story Bible...
"""  # Premature close on line 69
Target: 3500-4500 words total...  # This was OUTSIDE the string!
"""  # Actual close on line 333 (but Python saw it as start of new string)

# AFTER (FIXED):
return f"""Generate a comprehensive Story Bible...
Target: 3500-4500 words total...
...
"""  # Single proper close at end
```

**Validation**:
```bash
# Test Python imports locally
cd backend
python -c "import services.story_bible_service"
# Should complete without errors
```

**Prevention**:
- Use syntax highlighting in IDE (VS Code shows triple-quote matching)
- Run `python -m py_compile services/*.py` before committing
- Add pre-commit hook: `python -c "import services.story_bible_service"`

#### Cause 2: Missing Environment Variable

**Symptoms**:
```
KeyError: 'ANTHROPIC_API_KEY'
ValueError: MONGODB_URI not set
```

**Fix**:
```bash
# Railway dashboard → Variables → Add missing key
ANTHROPIC_API_KEY=sk-ant-...

# Or check in code
import os
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not set")
```

#### Cause 3: MongoDB Connection Failure

**Symptoms**:
```
ServerSelectionTimeoutError: connection timeout to MongoDB
```

**Fix**:
```bash
# 1. Check MongoDB Atlas IP whitelist
# Add Railway IPs: 0.0.0.0/0 (or specific Railway IP ranges)

# 2. Verify connection string
# Correct format:
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# 3. Test connection locally
mongosh "mongodb+srv://username:password@cluster.mongodb.net/database"
```

#### Cause 4: Health Check Endpoint Not Responding

**Expected**: `/api/health` returns 200 OK within 30 seconds

**Fix**:
```python
# backend/api/health.py
from fastapi import APIRouter, Response
from models.database import db

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check - always returns 200."""
    return {"status": "healthy"}

@router.get("/ready")
async def readiness_check():
    """Readiness check - verifies MongoDB connection."""
    try:
        await db.admin.command("ping")
        return {"status": "ready", "mongodb": "connected"}
    except Exception as e:
        return Response(
            content=f'{{"status": "not ready", "error": "{str(e)}"}}',
            status_code=503
        )
```

**Railway Health Check Configuration**:
- Path: `/api/health`
- Timeout: 30 seconds
- Interval: 30 seconds
- Failure threshold: 3

---

## Common Errors

### 1. JSONDecodeError: Expecting value

**Error**:
```python
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

**Location**: `backend/services/story_bible_service.py` (Story Bible generation)

**Cause**: Claude response truncated mid-JSON (exceeds 8K token limit)

**Fix**: JSON repair logic (already implemented)

**Code**:
```python
def parse_story_bible_json(response: str) -> Dict[str, Any]:
    try:
        data = json.loads(content)
        return data
    except json.JSONDecodeError as e:
        logger.warning("Attempting to repair incomplete JSON...")
        
        # Truncate at error position
        error_pos = e.pos if hasattr(e, 'pos') else len(content)
        truncated = content[:error_pos]
        
        # Close unterminated string
        if truncated.count('"') % 2 != 0:
            repaired = truncated + '"'
        
        # Balance brackets
        open_braces = truncated.count('{') - truncated.count('}')
        open_brackets = truncated.count('[') - truncated.count(']')
        repaired += ']' * open_brackets
        repaired += '}' * open_braces
        
        data = json.loads(repaired)
        return data
```

**Prevention**: Reduce word count targets (3500-4500 words, not 4000-6000)

### 2. ImportError: No module named 'X'

**Error**:
```
ModuleNotFoundError: No module named 'anthropic'
```

**Cause**: Missing dependency in Railway build

**Fix**:
```bash
# 1. Verify requirements.txt includes all dependencies
cat backend/requirements.txt | grep anthropic

# 2. Rebuild Railway service
railway up --detach

# 3. Check Railway build logs for pip install errors
railway logs --deployment
```

**Prevention**: Use `pip freeze > requirements.txt` after installing new packages

### 3. CORS Error in Browser

**Error** (Browser Console):
```
Access to fetch at 'https://api.railway.app/api/projects' from origin 'https://myapp.com' 
has been blocked by CORS policy
```

**Cause**: Frontend origin not in CORS allow list

**Fix**:
```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local dev
        "https://myapp.com",       # Production frontend
        "https://myapp.railway.app"  # Railway frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Railway Environment Variable**:
```env
FRONTEND_URL=https://myapp.com
```

### 4. 422 Unprocessable Entity (Pydantic Validation)

**Error**:
```json
{
  "detail": [
    {
      "loc": ["body", "genre"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Cause**: Request body missing required field

**Fix**: Verify frontend sends all required fields

**Example**:
```typescript
// WRONG
const response = await api.post('/api/projects', {
  title: 'My Novel'
  // Missing 'genre' field
});

// CORRECT
const response = await api.post('/api/projects', {
  title: 'My Novel',
  genre: 'Mystery',
  premise: {...}
});
```

**Validation**: Check Pydantic model for required fields

```python
class ProjectCreate(BaseModel):
    title: str  # Required
    genre: str  # Required
    premise: Premise  # Required
    ai_config: Optional[AIConfig] = None  # Optional
```

### 5. SSE Stream Timeout

**Error** (Frontend):
```
EventSource error: Connection closed
```

**Cause**: Railway free tier has 10-minute request timeout

**Fix**: Use bulk generation (automatic chunking) or upgrade Railway plan

**Workaround**:
```typescript
// Add auto-reconnect logic
const eventSource = new EventSource('/api/chapters/stream');
eventSource.onerror = () => {
  console.warn('Stream disconnected, retrying...');
  setTimeout(() => {
    // Reconnect with resumption token
    const newSource = new EventSource('/api/chapters/stream?resume=true');
  }, 1000);
};
```

---

## Database Issues

### MongoDB Connection Pool Exhausted

**Error**:
```
ServerSelectionTimeoutError: connection pool exhausted
```

**Cause**: Too many concurrent requests, not releasing connections

**Fix**:
```python
# backend/models/database.py
from motor.motor_asyncio import AsyncIOMotorClient

# Increase pool size
client = AsyncIOMotorClient(
    MONGODB_URI,
    maxPoolSize=50,  # Default 100, reduce for Railway
    minPoolSize=10,
    maxIdleTimeMS=30000
)
```

**Monitoring**:
```python
# Add connection pool metrics
@router.get("/metrics/mongodb")
async def mongodb_metrics():
    info = await db.client.server_info()
    return {
        "version": info["version"],
        "connections": db.client.nodes  # Active connections
    }
```

### MongoDB Atlas M0 (Free Tier) Limits

**Limits**:
- 512 MB storage
- 100 connections
- No point-in-time recovery

**Symptoms**:
- Slow queries (>5 seconds)
- Connection refused (100 limit hit)
- Out of storage errors

**Solutions**:
1. **Upgrade to M10** ($0.08/hour, 2GB RAM, 10GB storage)
2. **Optimize queries**: Add indexes, use projections
3. **Cleanup old data**: Delete test projects, old chapters

**Index Creation**:
```python
# Add in startup event
@app.on_event("startup")
async def create_indexes():
    await db.projects.create_index("title")
    await db.chapters.create_index([("project_id", 1), ("chapter_index", 1)])
    await db.conversations.create_index("created_at", expireAfterSeconds=2592000)  # 30 days
```

---

## API Key Problems

### Anthropic Rate Limits

**Error**:
```
RateLimitError: Request was throttled. Expected available in 2 seconds.
```

**Limits** (Tier 1):
- 50 requests per minute
- 40,000 tokens per minute

**Fix**:
```python
# backend/services/ai_service.py
import asyncio
from anthropic import RateLimitError

async def chat_with_retry(prompt: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            response = await anthropic.messages.create(...)
            return response
        except RateLimitError as e:
            wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
            logger.warning(f"Rate limited, waiting {wait_time}s...")
            await asyncio.sleep(wait_time)
            if attempt == max_retries - 1:
                raise
```

**Prevention**:
- Request rate limit increase (Anthropic dashboard)
- Implement request queue (Redis/Celery)
- Cache common responses

### OpenAI Quota Exceeded

**Error**:
```
openai.error.RateLimitError: You exceeded your current quota
```

**Cause**: Free trial credits depleted or monthly quota hit

**Fix**:
1. **Add payment method** (OpenAI dashboard → Billing)
2. **Set usage limits** (dashboard → Usage limits → Hard limit $X/month)
3. **Switch to Anthropic for premise synthesis** (optional)

**Monitoring**:
```python
# Log token usage
@router.post("/api/premises/synthesize")
async def synthesize_premise(...):
    response = await openai.chat.completions.create(...)
    logger.info(f"OpenAI usage: {response.usage.total_tokens} tokens")
    return response
```

---

## Performance Optimization

### Slow Chapter Generation (>5 minutes)

**Diagnosis**:
```python
# Add timing logs
import time

start = time.time()
response = await ai_service.chat(prompt)
duration = time.time() - start
logger.info(f"Chapter generation took {duration:.2f}s")
```

**Optimizations**:

1. **Reduce Context Size**:
```python
# Use summaries for older chapters (not full text)
if chapter_index > 4:
    context += chapter_summaries[0:chapter_index-3]  # Summaries
else:
    context += chapters[0:chapter_index]  # Full text
```

2. **Increase Temperature** (faster generation):
```python
response = await anthropic.messages.create(
    temperature=0.8,  # Was 0.7, higher = faster (slight quality tradeoff)
    max_tokens=4000   # Target word count
)
```

3. **Use GPT-4o-mini** (10x faster, cheaper):
```python
# For non-critical generations (summaries, simple tasks)
response = await openai.chat.completions.create(
    model="gpt-4o-mini",  # Instead of gpt-4o
    temperature=0.7,
    max_tokens=500
)
```

### Database Query Optimization

**Slow Query** (N+1 problem):
```python
# BAD: Queries database for each chapter
for chapter_index in range(25):
    chapter = await db.chapters.find_one({"project_id": project_id, "chapter_index": chapter_index})
```

**Fast Query** (single aggregation):
```python
# GOOD: Single query fetches all chapters
chapters = await db.chapters.find({"project_id": project_id}).sort("chapter_index", 1).to_list(None)
```

**Add Indexes**:
```python
await db.chapters.create_index([("project_id", 1), ("chapter_index", 1)])
# Query time: 2000ms → 5ms
```

---

## Monitoring & Logging

### Railway Logs

**View Logs**:
```bash
# Real-time logs
railway logs

# Last 100 lines
railway logs -n 100

# Filter by service
railway logs --service backend
```

**Log Levels**:
```python
# backend/main.py
import logging

logging.basicConfig(
    level=logging.INFO,  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
```

### Application Metrics

**Add Metrics Endpoint**:
```python
# backend/api/metrics.py
from fastapi import APIRouter
import time

router = APIRouter()

start_time = time.time()

@router.get("/metrics")
async def get_metrics():
    return {
        "uptime_seconds": int(time.time() - start_time),
        "mongodb_status": "connected" if db.client else "disconnected",
        "total_projects": await db.projects.count_documents({}),
        "total_chapters": await db.chapters.count_documents({}),
    }
```

### Error Tracking

**Integrate Sentry** (optional):
```python
# pip install sentry-sdk
import sentry_sdk

sentry_sdk.init(
    dsn="https://...@sentry.io/...",
    environment="production",
    traces_sample_rate=0.1
)
```

**Custom Error Handler**:
```python
from fastapi import HTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

---

## Rollback Procedures

### Railway Rollback

**Option 1: Railway Dashboard**
1. Navigate to project → Deployments
2. Find previous successful deployment
3. Click "Redeploy" button

**Option 2: Git Revert**
```bash
# Revert last commit
git revert HEAD
git push origin main
# Railway auto-deploys previous version

# Revert specific commit
git revert <commit-hash>
git push origin main
```

**Option 3: Railway CLI**
```bash
# Rollback to previous deployment
railway rollback
```

### Database Rollback

**MongoDB Atlas Point-in-Time Restore** (M10+ tier only):
1. Atlas dashboard → Clusters → Backup
2. Select restore point (timestamp)
3. Restore to new cluster (test first)
4. Update `MONGODB_URI` to new cluster

**Manual Backup/Restore**:
```bash
# Backup before deployment
mongodump --uri="mongodb+srv://..." --out=backup-2025-11-29

# Restore if needed
mongorestore --uri="mongodb+srv://..." backup-2025-11-29/
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally (`pytest backend/tests/`)
- [ ] Python imports validated (`python -c "import services.story_bible_service"`)
- [ ] Environment variables documented (`.env.example` updated)
- [ ] Database migrations tested (if schema changes)
- [ ] API endpoints tested (Postman/curl)
- [ ] Frontend build succeeds (`npm run build`)

### Deployment
- [ ] Git push triggers Railway deploy
- [ ] Deployment logs show no errors
- [ ] Health check endpoint responding (`/api/health`)
- [ ] MongoDB connection successful (`/api/ready`)
- [ ] Test API call succeeds (create project, generate chapter)

### Post-Deployment
- [ ] Monitor Railway logs for 5 minutes (no errors)
- [ ] Verify frontend connects to backend
- [ ] Test critical workflows (premise → story bible → outline → chapter)
- [ ] Check performance metrics (response times <2s)
- [ ] Verify error tracking active (Sentry/logs)

### Rollback Criteria
- [ ] Health checks failing for >2 minutes
- [ ] Error rate >10% of requests
- [ ] Database connection failures
- [ ] Critical feature broken (chapter generation)
- [ ] User-reported production issues

---

## Quick Reference

**Railway Commands**:
```bash
railway login          # Authenticate
railway link           # Link project
railway logs           # View logs
railway status         # Check deployment status
railway rollback       # Revert deployment
railway open           # Open in browser
```

**Health Checks**:
```bash
# Basic health
curl https://your-app.railway.app/api/health

# MongoDB readiness
curl https://your-app.railway.app/api/ready

# Metrics
curl https://your-app.railway.app/metrics
```

**Emergency Contacts**:
- Railway Status: https://status.railway.app
- MongoDB Atlas Status: https://status.mongodb.com
- Anthropic Status: https://status.anthropic.com

---

**Last Updated**: November 29, 2025  
**Maintained By**: DevOps Team  
**Next Review**: After Phase 2 deployment

---

**See Also**:
- [docs/railway-deployment.md](railway-deployment.md) - Detailed Railway setup
- [README.md](../README.md) - Architecture overview
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - All documentation
