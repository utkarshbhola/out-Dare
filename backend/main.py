from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import events, chat

app = FastAPI(title="OutThere Backend API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "OutThere Backend API"}
