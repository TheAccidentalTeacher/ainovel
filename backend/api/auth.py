"""
Authentication API endpoints for user registration, login, and profile management.

Provides JWT-based authentication with secure password handling.
🦸 CODE MASTER: BraveStarr's Justice - Security First!
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.database import get_database
from models.schemas import UserCreate, UserLogin, Token, User
from services.auth_service import AuthService
from config.settings import get_settings

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


def get_auth_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AuthService:
    """
    Dependency to create AuthService instance.
    
    Args:
        db: MongoDB database connection
        
    Returns:
        Configured AuthService
    """
    settings = get_settings()
    return AuthService(
        db=db,
        secret_key=settings.secret_key,
        token_expire_minutes=settings.access_token_expire_minutes
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Register new user account.
    
    **BY THE POWER OF GRAYSKULL!** Creates new user with secure password hashing.
    
    Args:
        request: Registration data (email, password, name)
        
    Returns:
        JWT token and user profile
        
    Raises:
        400: Email already registered
    """
    # Create user account
    user = await auth_service.register_user(
        email=request.email,
        password=request.password,
        name=request.name
    )
    
    # Generate JWT token
    token = auth_service.create_access_token(user.id, user.email)
    
    # Return token and user data (exclude password)
    user_dict = user.model_dump(exclude={"hashed_password"})
    
    return Token(
        access_token=token,
        token_type="bearer",
        user=user_dict
    )


@router.post("/login", response_model=Token)
async def login(
    request: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Login existing user.
    
    **THUNDER, THUNDER, THUNDERCATS!** Validates credentials and issues token.
    
    Args:
        request: Login credentials (email, password)
        
    Returns:
        JWT token and user profile
        
    Raises:
        401: Invalid credentials
        403: Account deactivated
    """
    # Authenticate user
    user = await auth_service.authenticate_user(
        email=request.email,
        password=request.password
    )
    
    # Generate JWT token
    token = auth_service.create_access_token(user.id, user.email)
    
    # Return token and user data (exclude password)
    user_dict = user.model_dump(exclude={"hashed_password"})
    
    return Token(
        access_token=token,
        token_type="bearer",
        user=user_dict
    )


@router.get("/me", response_model=User)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get current authenticated user profile.
    
    **EYES OF THE HAWK!** Validates JWT token and returns user info.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        Current user profile
        
    Raises:
        401: Invalid or expired token
        404: User not found
    """
    # Decode and validate token
    token_data = auth_service.decode_token(credentials.credentials)
    
    # Fetch user from database
    user_data = await db.users.find_one({"id": token_data.user_id})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(**user_data)


# ==================== Dependency for Protected Routes ====================

async def get_current_user_dep(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> User:
    """
    Dependency to get current authenticated user.
    
    Use this as a dependency in protected route handlers to ensure
    the user is authenticated and get their User object.
    
    **🦸 CODE MASTER GUARDIAN PROTOCOL**
    
    Example:
        ```python
        @router.get("/projects")
        async def list_projects(
            current_user: User = Depends(get_current_user_dep)
        ):
            # current_user is authenticated User object
            projects = await db.projects.find({"user_id": current_user.id})
            return projects
        ```
    
    Args:
        credentials: Bearer token from Authorization header
        auth_service: Authentication service
        db: Database connection
        
    Returns:
        Authenticated User object
        
    Raises:
        401: Invalid/expired token
        404: User not found
    """
    # Decode and validate token
    token_data = auth_service.decode_token(credentials.credentials)
    
    # Fetch user from database
    user_data = await db.users.find_one({"id": token_data.user_id})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = User(**user_data)
    
    # Verify account is still active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated"
        )
    
    return user
