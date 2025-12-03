"""
Authentication service for user management and JWT token handling.

Handles password hashing with bcrypt and JWT token generation/validation.
BY THE POWER OF CLEAN CODE - BraveStarr's Justice!
"""

from datetime import datetime, timedelta
from typing import Optional

import jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from models.schemas import User, TokenData

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """
    Authentication service with JWT tokens and password security.
    
    🦸 CODE MASTER SECURITY PROTOCOLS:
    - Bcrypt password hashing (BraveStarr's strength!)
    - JWT tokens with 7-day expiration
    - Token validation with error handling
    - User session management
    """
    
    def __init__(self, db: AsyncIOMotorDatabase, secret_key: str, token_expire_minutes: int = 10080):
        self.db = db
        self.secret_key = secret_key
        self.algorithm = "HS256"
        self.access_token_expire = timedelta(minutes=token_expire_minutes)
    
    def hash_password(self, password: str) -> str:
        """
        Hash password with bcrypt via passlib.
        
        Args:
            password: Plain text password
            
        Returns:
            Bcrypt hashed password
        """
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify password against hash.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Bcrypt hash to check against
            
        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, user_id: str, email: str) -> str:
        """
        Create JWT access token.
        
        Args:
            user_id: User ID to embed in token
            email: User email to embed in token
            
        Returns:
            JWT token string
        """
        expire = datetime.utcnow() + self.access_token_expire
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> TokenData:
        """
        Decode and verify JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            TokenData with user info
            
        Raises:
            HTTPException: If token is expired or invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return TokenData(
                user_id=payload["user_id"],
                email=payload["email"],
                exp=datetime.fromtimestamp(payload["exp"])
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    async def register_user(self, email: str, password: str, name: str) -> User:
        """
        Register new user account.
        
        Args:
            email: User email (must be unique)
            password: Plain text password (will be hashed)
            name: User display name
            
        Returns:
            Created User object
            
        Raises:
            HTTPException: If email already registered
        """
        # Check if email already exists
        existing = await self.db.users.find_one({"email": email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already registered"
            )
        
        # Create new user
        user = User(
            email=email.lower(),
            hashed_password=self.hash_password(password),
            name=name
        )
        
        # Insert into database
        await self.db.users.insert_one(user.model_dump())
        
        return user
    
    async def authenticate_user(self, email: str, password: str) -> User:
        """
        Verify credentials and return user.
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            User object if credentials valid
            
        Raises:
            HTTPException: If credentials invalid or account inactive
        """
        # Find user by email
        user_data = await self.db.users.find_one({"email": email.lower()})
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user = User(**user_data)
        
        # Verify password
        if not self.verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check if account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been deactivated"
            )
        
        # Update last login timestamp
        await self.db.users.update_one(
            {"id": user.id},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Retrieve user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object or None if not found
        """
        user_data = await self.db.users.find_one({"id": user_id})
        if not user_data:
            return None
        return User(**user_data)
