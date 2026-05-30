from fastapi import Header, HTTPException

async def get_current_user(
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing token"
        )

    return authorization