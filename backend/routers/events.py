from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import supabase
from models import EventCreate

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
def create_event(event: EventCreate):
    try:
        # Create event
        event_data = {
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "emoji": event.emoji,
            "location": event.location,
            "event_time": event.time,
            "created_by": "00000000-0000-0000-0000-000000000001" # Mock user
        }
        event_response = supabase.table("events").insert(event_data).execute()
        new_event = event_response.data[0]
        
        # Add creator as attendee
        supabase.table("event_attendees").insert({
            "event_id": new_event["id"],
            "profile_id": "00000000-0000-0000-0000-000000000001",
            "is_solo": True
        }).execute()
        
        return new_event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{event_id}/join")
def join_event(event_id: str):
    try:
        response = supabase.table("event_attendees").insert({
            "event_id": event_id,
            "profile_id": "00000000-0000-0000-0000-000000000001",
            "is_solo": True
        }).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
