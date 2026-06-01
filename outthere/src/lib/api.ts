import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const API_BASE_URL = 'http://localhost:8000/api';

async function getHeaders(): Promise<HeadersInit> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function fetchEvents() {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/events`, {
    headers,
  });
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

export async function createEvent(eventData: any) {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers,
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
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/join`, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to join event');
  }
  return response.json();
}

export async function sendChatMessage(content: string) {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers,
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
