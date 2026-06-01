from fastapi import Header, HTTPException
from db import supabase

async def get_current_user(
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization Header"
        )

    try:
        # Extract token from the Bearer token scheme
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(
                status_code=401,
                detail="Invalid authorization scheme. Use 'Bearer <token>'"
            )

        # Validate token with Supabase and fetch user object
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session token"
            )

        return user_response.user
    except Exception as e:
        print("Backend Authentication Error:", e)
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )