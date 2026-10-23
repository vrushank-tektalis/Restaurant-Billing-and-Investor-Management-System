from __future__ import annotations
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="Plaintext password")


class UserResponse(ORMBase):
    id: int
    name: str
    email: str
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: Literal["ADMIN", "CASHIER", "INVESTOR"] = "CASHIER"


class PasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=100)
