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
    import os
    settings = get_settings()
    
    logger.info("=== APPLICATION STARTING ===")
    logger.info("application_startup", 
                environment=settings.environment,
                port=os.getenv("PORT", "8000"),
                mongodb_uri_set=bool(settings.mongodb_uri))
    
    # Initialize database connection
    try:
        db = await get_database()
        # Test connection with a ping
        await db.command("ping")
        logger.info("✅ database_connected", status="success")
    except Exception as e:
        logger.error("❌ database_connection_failed", error=str(e), error_type=type(e).__name__)
        # Continue anyway - some endpoints might still work
    
    logger.info("=== APPLICATION READY ===")
    
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
    from api import health, projects, genres, outlines, story_bible, chapters, summaries, bulk_generation, export, premise_builder, chat, contexts, health_check, avatars, auth
    
    # 🦸 CODE MASTER: Authentication First! (BraveStarr's Justice)
    app.include_router(auth.router, prefix="/api", tags=["authentication"])
    app.include_router(health.router, prefix="/api", tags=["health"])
    app.include_router(health_check.router, prefix="/api", tags=["health-check"])  # 🦸 CODE MASTER: Comprehensive testing!
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
    app.include_router(contexts.router, prefix="/api", tags=["contexts"])
    app.include_router(avatars.router, tags=["avatars"])  # 🎭 Multi-Avatar Creative System
    
    # === Custom Avatar Management ===
    from api import custom_avatars
    app.include_router(custom_avatars.router, tags=["custom-avatars"])
    
    # === Book Cover Generation (Feature Flagged) ===
    # Router enabled for testing - feature flag still controls access
    # Requires: BOOK_COVERS_ENABLED=true in .env to use endpoints
    from book_covers.routes import router as book_covers_router
    app.include_router(book_covers_router, prefix="/api/book-covers", tags=["book-covers"])
    
    # === 🦸 CODE MASTER: Serve Health Dashboard ===
    # Serve the health dashboard at /health-dashboard
    from fastapi.responses import HTMLResponse
    
    @app.get("/health-dashboard", response_class=HTMLResponse)
    async def serve_health_dashboard():
        """Serve the Code Master health dashboard"""
        dashboard_path = Path(__file__).parent.parent / "health-dashboard.html"
        if dashboard_path.exists():
            return HTMLResponse(content=dashboard_path.read_text(encoding='utf-8'), status_code=200)
        return HTMLResponse(content="<h1>Health dashboard not found</h1>", status_code=404)
    
    # === Serve Frontend Static Files ===
    # Mount the React app's build output (production only)
    # In Docker: /app/frontend/dist, Local dev: ../frontend/dist
    frontend_dist = Path(__file__).parent / "frontend" / "dist"
    if not frontend_dist.exists():
        # Fallback for local development
        frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
    
    if frontend_dist.exists() and settings.is_production:
        # Mount static files at root, but API routes take precedence (registered first)
        # Use a catch-all route for SPA routing
        from fastapi.responses import FileResponse
        
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Serve React SPA, but let API routes take precedence."""
            # Don't intercept API routes - they're already registered
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="Not found")
            
            # Try to serve the requested file
            file_path = frontend_dist / full_path
            if file_path.is_file():
                return FileResponse(file_path)
            
            # Fallback to index.html for client-side routing
            return FileResponse(frontend_dist / "index.html")
        
        logger.info("frontend_spa_serving_configured", path=str(frontend_dist))
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
