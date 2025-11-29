"""
AI Novel Generator FastAPI Application Entry Point

This module bootstraps the FastAPI application, registers routes,
configures middleware, and initializes database connections.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from pathlib import Path

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config.settings import get_settings
from models.database import get_database, close_database_connection

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    FastAPI lifespan context manager for startup and shutdown events.
    
    Handles:
    - Database connection initialization
    - Resource cleanup on shutdown
    """
    settings = get_settings()
    logger.info("application_startup", environment=settings.environment)
    
    # Initialize database connection
    await get_database()
    logger.info("database_connected")
    
    yield
    
    # Cleanup
    await close_database_connection()
    logger.info("application_shutdown")


def create_application() -> FastAPI:
    """
    Application factory that creates and configures the FastAPI instance.
    
    Returns:
        FastAPI: Configured application instance
    """
    settings = get_settings()
    
    app = FastAPI(
        title="AI Novel Generator API",
        description="Backend API for automated AI-powered novel generation",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    
    # CORS middleware configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register API routes
    from api import health, projects, genres, outlines, story_bible, chapters, summaries, bulk_generation, export, premise_builder, chat
    
    app.include_router(health.router, prefix="/api", tags=["health"])
    app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
    app.include_router(premise_builder.router, tags=["premise-builder"])
    app.include_router(story_bible.router, prefix="/api", tags=["story-bible"])
    app.include_router(outlines.router, prefix="/api/projects", tags=["outlines"])
    app.include_router(chapters.router, prefix="/api/projects", tags=["chapters"])
    app.include_router(summaries.router, prefix="/api/projects", tags=["summaries"])
    app.include_router(bulk_generation.router, prefix="/api/projects", tags=["bulk-generation"])
    app.include_router(export.router, prefix="/api/projects", tags=["export"])
    app.include_router(genres.router, prefix="/api", tags=["genres"])
    app.include_router(chat.router, prefix="/api", tags=["chat"])
    
    # === Book Cover Generation (Feature Flagged) ===
    # Router enabled for testing - feature flag still controls access
    # Requires: BOOK_COVERS_ENABLED=true in .env to use endpoints
    from book_covers.routes import router as book_covers_router
    app.include_router(book_covers_router, prefix="/api/book-covers", tags=["book-covers"])
    
    # === Serve Frontend Static Files ===
    # Mount the React app's build output (production only)
    # In Docker: /app/frontend/dist, Local dev: ../frontend/dist
    frontend_dist = Path(__file__).parent / "frontend" / "dist"
    if not frontend_dist.exists():
        # Fallback for local development
        frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
    
    if frontend_dist.exists() and settings.is_production:
        app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
        logger.info("frontend_static_files_mounted", path=str(frontend_dist))
    else:
        logger.warning("frontend_dist_not_found", path=str(frontend_dist), exists=frontend_dist.exists(), is_production=settings.is_production)
    
    return app


# Create the application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development",
        log_level="info",
    )
