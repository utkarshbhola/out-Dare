const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchEvents() {
  const response = await fetch(`${API_BASE_URL}/events`);
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

export async function createEvent(eventData: any) {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      emoji: eventData.emoji,
      location: eventData.location,
      time: eventData.time,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create event');
  }
  return response.json();
}

export async function joinEvent(eventId: string) {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/join`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to join event');
  }
  return response.json();
}

export async function sendChatMessage(content: string) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'user',
      content,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
}
