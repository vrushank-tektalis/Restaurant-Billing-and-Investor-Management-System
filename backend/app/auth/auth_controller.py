from __future__ import annotations
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.security import verify_password, hash_password, create_access_token
from app.auth.schemas import LoginRequest, TokenResponse, UserResponse, UserCreateRequest


def authenticate_user(db: Session, request: LoginRequest) -> TokenResponse:
    """
    Authenticate user by email and password, returning JWT access token.
    """
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    # Issue token containing user ID and role
    token_payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }
    access_token = create_access_token(data=token_payload)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


def create_user(db: Session, request: UserCreateRequest) -> User:
    """
    Create a new user account (admin, cashier, or investor).
    """
    existing = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{request.email}' already exists.",
        )

    hashed = hash_password(request.password)
    user = User(
        name=request.name.strip(),
        email=request.email.lower().strip(),
        password_hash=hashed,
        role=request.role.upper(),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
