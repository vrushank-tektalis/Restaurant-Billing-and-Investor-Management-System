from __future__ import annotations
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.models import User
from app.auth.schemas import LoginRequest, TokenResponse, UserResponse
from app.auth.security import get_current_user
from app.auth import auth_controller as controller

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and receive JWT access token",
)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    return controller.authenticate_user(db=db, request=request)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get profile of currently logged-in user",
)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post(
    "/logout",
    summary="Log out and clear client session",
)
def logout(current_user: User = Depends(get_current_user)):
    """
    Stateless JWT logout: informs client to clear their stored access token.
    """
    return {"message": "Logged out successfully. Please remove the access token on client."}
