"""
Database connection and management.

Provides async MongoDB connection pooling and lifecycle management
using Motor (async MongoDB driver).
"""

from typing import Optional

import structlog
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config.settings import get_settings

logger = structlog.get_logger()

# Global database client and connection
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def get_database() -> AsyncIOMotorDatabase:
    """
    Get or create the MongoDB database connection.
    
    Returns a cached database instance if available, otherwise creates
    a new connection. Thread-safe for async contexts.
    
    Returns:
        AsyncIOMotorDatabase: MongoDB database instance
    """
    global _client, _database
    
    if _database is not None:
        return _database
    
    settings = get_settings()
    
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            maxPoolSize=50,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,
        )
        
        _database = _client[settings.mongodb_database]
        
        # Verify connection with ping
        await _database.command("ping")
        
        logger.info(
            "mongodb_connected",
            database=settings.mongodb_database,
            uri=settings.mongodb_uri.split("@")[-1] if "@" in settings.mongodb_uri else "localhost"
        )
        
        # Create indexes
        await _create_indexes(_database)
        
        return _database
        
    except Exception as e:
        logger.error("mongodb_connection_failed", error=str(e))
        raise


async def close_database_connection() -> None:
    """
    Close the MongoDB connection.
    
    Should be called during application shutdown to cleanly
    close connection pools and release resources.
    """
    global _client, _database
    
    if _client is not None:
        _client.close()
        _client = None
        _database = None
        logger.info("mongodb_connection_closed")


async def _create_indexes(db: AsyncIOMotorDatabase) -> None:
    """
    Create database indexes for optimal query performance.
    
    Indexes are created asynchronously and are idempotent.
    
    Args:
        db: MongoDB database instance
    """
    # Projects collection indexes
    await db.projects.create_index("user_id")
    await db.projects.create_index([("created_at", -1)])
    await db.projects.create_index([("status", 1), ("updated_at", -1)])
    
    # Chapters collection indexes
    await db.chapters.create_index([("project_id", 1), ("chapter_index", 1)], unique=True)
    await db.chapters.create_index("project_id")
    
    # Summaries collection indexes
    await db.summaries.create_index([("project_id", 1), ("chapter_range", 1)])
    
    # Book covers collection indexes
    await db.book_covers.create_index("project_id")
    await db.book_covers.create_index([("status", 1), ("created_at", -1)])
    await db.cover_design_briefs.create_index("project_id")
    await db.cover_iterations.create_index("book_cover_id")
    
    logger.info("database_indexes_created")


def get_collection_name(model_name: str) -> str:
    """
    Get the MongoDB collection name for a given model.
    
    Args:
        model_name: Name of the model class
        
    Returns:
        str: Collection name (pluralized, lowercase)
    """
    # Simple pluralization - can be enhanced with inflect library
    if model_name.endswith('y'):
        return f"{model_name[:-1]}ies"
    return f"{model_name}s".lower()
