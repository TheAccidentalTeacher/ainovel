"""
Seed endpoint to create test users in production.
ONE-TIME USE - Remove after deployment!
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from services.auth_service import AuthService
from models.database import get_database
from config.settings import get_settings

router = APIRouter()

@router.post("/seed-users")
async def seed_test_users(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create test users for immediate access.
    🦸 BY THE POWER OF GRAYSKULL - INSTANT ACCESS!
    """
    settings = get_settings()
    auth_service = AuthService(
        db=db,
        secret_key=settings.SECRET_KEY,
        token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    users_created = []
    
    # User 1: abc123
    try:
        existing = await db.users.find_one({"email": "abc123@example.com"})
        if existing:
            await db.users.delete_one({"email": "abc123@example.com"})
        
        user1 = await auth_service.register_user(
            email="abc123@example.com",
            password="abc12345",
            name="abc123"
        )
        users_created.append({
            "email": "abc123@example.com",
            "password": "abc12345",
            "name": "abc123"
        })
    except Exception as e:
        pass  # User might already exist
    
    # User 2: Alana
    try:
        existing = await db.users.find_one({"email": "alana@example.com"})
        if existing:
            await db.users.delete_one({"email": "alana@example.com"})
            
        user2 = await auth_service.register_user(
            email="alana@example.com",
            password="Terry123",
            name="Alana"
        )
        users_created.append({
            "email": "alana@example.com",
            "password": "Terry123",
            "name": "Alana"
        })
    except Exception as e:
        pass  # User might already exist
    
    return {
        "status": "success",
        "message": "Test users created",
        "users": users_created
    }
