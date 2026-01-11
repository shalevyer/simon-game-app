/**
 * Auth Service
 * 
 * HTTP API calls for session management.
 */

import type { 
  CreateSessionResponse, 
  JoinGameResponse, 
  VerifySessionResponse 
} from '../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Debug: Log API URL (will be visible in browser console)
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 Environment:', import.meta.env.MODE);

/**
 * Create a new game session (host)
 */
export async function createSession(
  displayName: string,
  avatarId: string
): Promise<CreateSessionResponse> {
  const url = `${API_BASE_URL}/api/auth/create-session`;
  console.log('📤 Creating session:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Send/receive cookies
      body: JSON.stringify({ displayName, avatarId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      console.error('❌ Create session error:', error);
      throw new Error(error.error || 'Failed to create session');
    }

    return response.json();
  } catch (error) {
    console.error('❌ Fetch error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Check if the server is running and CORS is configured.`);
    }
    throw error;
  }
}

/**
 * Join an existing game
 */
export async function joinGame(
  displayName: string,
  avatarId: string,
  gameCode: string
): Promise<JoinGameResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/join-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Send/receive cookies
    body: JSON.stringify({ displayName, avatarId, gameCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join game');
  }

  return response.json();
}

/**
 * Verify if session is valid (on page load)
 */
export async function verifySession(): Promise<VerifySessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-session`, {
    method: 'GET',
    credentials: 'include', // CRITICAL: Send cookies
  });

  if (!response.ok) {
    return { valid: false };
  }

  return response.json();
}

/**
 * Logout and leave game
 */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
