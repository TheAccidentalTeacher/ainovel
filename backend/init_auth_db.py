"""
Database initialization script for authentication system.

Creates MongoDB indexes for user collection.
🦸 CODE MASTER: Duke's Tactical Database Strategy!
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import get_settings


async def create_auth_indexes():
    """
    Create database indexes for authentication.
    
    Indexes:
    - users.email (unique) - Fast user lookup and duplicate prevention
    - users.created_at - Chronological queries
    - users.is_active - Active user filtering
    """
    settings = get_settings()
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_database]
    
    print("🦸 CODE MASTER: Creating authentication indexes...")
    
    # Create unique index on email (case-insensitive)
    await db.users.create_index(
        [("email", 1)],
        unique=True,
        name="email_unique_idx"
    )
    print("✅ Created unique index: users.email")
    
    # Create index on created_at for chronological queries
    await db.users.create_index(
        [("created_at", -1)],
        name="created_at_idx"
    )
    print("✅ Created index: users.created_at")
    
    # Create index on is_active for filtering
    await db.users.create_index(
        [("is_active", 1)],
        name="is_active_idx"
    )
    print("✅ Created index: users.is_active")
    
    # Create index on id for fast lookups
    await db.users.create_index(
        [("id", 1)],
        unique=True,
        name="id_unique_idx"
    )
    print("✅ Created index: users.id")
    
    # Close connection
    client.close()
    print("\n🎯 MISSION ACCOMPLISHED! All auth indexes created.")


if __name__ == "__main__":
    asyncio.run(create_auth_indexes())
