from fastapi import APIRouter, HTTPException, Depends
from db import supabase
from models import EventCreate
from dependencies import get_current_user

router = APIRouter()

@router.get("/")
def get_events():
    try:
        response = supabase.table("events").select(
            "*, event_attendees(is_solo, profiles(avatar_url)), groups(*)"
        ).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_event(
    event: EventCreate,
    current_user = Depends(get_current_user)
):
    try:
        # Create event using authenticated user's ID
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
        
        # Add creator as attendee
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
    try:
        # Add attendee mapping to authenticated user's ID
        response = supabase.table("event_attendees").insert({
            "event_id": event_id,
            "profile_id": current_user.id,
            "is_solo": True
        }).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
