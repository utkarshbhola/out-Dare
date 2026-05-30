from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
def get_me():
    return {
        "id": "test",
        "name": "test"
    }