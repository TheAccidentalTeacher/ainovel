"""
Health check endpoints for monitoring and readiness probes.
"""

from datetime import datetime
from typing import Dict, Any

import structlog
from fastapi import APIRouter, status
from pydantic import BaseModel

from config.settings import get_settings
from models.database import get_database

logger = structlog.get_logger()
router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: datetime
    environment: str
    version: str
    services: Dict[str, str]


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Returns application health status and service availability"
)
async def health_check() -> HealthResponse:
    """
    Comprehensive health check endpoint.
    
    Verifies:
    - API is running
    - Database connection is active
    - Environment configuration
    
    Returns:
        HealthResponse: Current health status and metadata
    """
    settings = get_settings()
    services = {"api": "healthy"}
    
    # Check database connection
    try:
        db = await get_database()
        # Ping database to verify connection
        await db.command("ping")
        services["database"] = "healthy"
    except Exception as e:
        logger.error("database_health_check_failed", error=str(e))
        services["database"] = "unhealthy"
    
    overall_status = "healthy" if all(s == "healthy" for s in services.values()) else "degraded"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        environment=settings.environment,
        version="0.1.0",
        services=services
    )


@router.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    summary="Readiness Check",
    description="Returns 200 if service is ready to accept requests"
)
async def readiness_check() -> Dict[str, str]:
    """
    Kubernetes/Railway readiness probe endpoint.
    
    Simpler than /health, just confirms the service is running.
    """
    return {"status": "ready"}
