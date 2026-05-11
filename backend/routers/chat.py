from fastapi import APIRouter
from models import ChatMessage
import asyncio

router = APIRouter()

@router.post("/")
async def chat_with_concierge(message: ChatMessage):
    # Simulated AI delay
    await asyncio.sleep(1)
    
    # Simple mock response
    user_msg = message.content.lower()
    
    response_text = "I'm your OutThere Concierge. How can I help you find plans or people?"
    
    if "solo" in user_msg or "hsr" in user_msg:
         response_text = "Found 3 people from HSR going solo. Sarah (@sarahj) is also looking for a carpool. Should I ping her?"
    elif "create" in user_msg or "plan" in user_msg:
         response_text = "I can help you create an event! Just click the 'Create Event' button at the top right."
         
    return {"role": "ai", "content": response_text}
