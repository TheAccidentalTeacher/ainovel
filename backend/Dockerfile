FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies in stages to reduce memory pressure
COPY backend/requirements.txt .
# Install core dependencies first
RUN pip install --no-cache-dir fastapi uvicorn[standard] pydantic pydantic-settings
# Install database
RUN pip install --no-cache-dir motor pymongo
# Install AI SDKs (these are large)
RUN pip install --no-cache-dir openai anthropic
# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Copy built frontend from first stage
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

# Copy config directory
COPY config/ /app/config/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Railway provides PORT env var
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
