/**
 * Centralized API configuration for Omniverse Platform.
 * 
 * Logic:
 * - Production (Vercel): Uses NEXT_PUBLIC_API_URL environment variable.
 * - Development (Local): Defaults to http://localhost:8000.
 */

const getApiBaseUrl = () => {
    // If we have an environment variable, use it (Vercel)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Fallback for local development
    return "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();

// Specific endpoints helper
export const API_ENDPOINTS = {
    CHAT: `${API_BASE_URL}/chat/`,
    MODELS: `${API_BASE_URL}/models`,
    PREDICT: `${API_BASE_URL}/predict`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
};
