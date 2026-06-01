from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from db import supabase
from models import EventCreate
from dependencies import get_current_user

RATE_LIMIT_CONFIG = {
    'create': (5, 60),
    'join': (12, 60),
    'leave': (12, 60),
}
_rate_limit_records: dict[tuple[str, str], list[datetime]] = defaultdict(list)

router = APIRouter()


def enforce_rate_limit(user_id: str, action: str):
    limit, window_seconds = RATE_LIMIT_CONFIG.get(action, (10, 60))
    now = datetime.utcnow()
    key = (user_id, action)
    recent = [timestamp for timestamp in _rate_limit_records[key] if now - timestamp < timedelta(seconds=window_seconds)]
    if len(recent) >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Too many {action} requests. Please wait a moment and try again."
        )
    recent.append(now)
    _rate_limit_records[key] = recent


@router.get("/")
def get_events():
    try:
        response = supabase.table("events").select(
            "*, event_attendees(profile_id,is_solo,profiles(avatar_url)), groups(*)"
        ).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_event(
    event: EventCreate,
    current_user = Depends(get_current_user)
):
    enforce_rate_limit(current_user.id, 'create')
    try:
        event_data = {
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "emoji": event.emoji,
            "location": event.location,
            "event_time": event.time,
            "created_by": current_user.id
        }
        event_response = supabase.table("events").insert(event_data).execute()
        new_event = event_response.data[0]

        supabase.table("event_attendees").insert({
            "event_id": new_event["id"],
            "profile_id": current_user.id,
            "is_solo": True
        }).execute()

        return new_event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/join")
def join_event(
    event_id: str,
    current_user = Depends(get_current_user)
):
    enforce_rate_limit(current_user.id, 'join')
    try:
        response = supabase.table("event_attendees").insert({
            "event_id": event_id,
            "profile_id": current_user.id,
            "is_solo": True
        }).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}/join")
def leave_event(
    event_id: str,
    current_user = Depends(get_current_user)
):
    enforce_rate_limit(current_user.id, 'leave')
    try:
        response = supabase.table("event_attendees").delete().eq("event_id", event_id).eq("profile_id", current_user.id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="You are not currently joined to this event.")
        return {"status": "left"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
