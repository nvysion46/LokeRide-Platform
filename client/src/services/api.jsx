import { useAuthStore } from '../store/authStore';
// Removed unused 'toast' import

const BASE_URL = 'http://localhost:5000';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    const headers = {
        'Content-Type': 'application/json',
    };

    // Only add Authorization if token exists and is valid
    if (token && token !== "null" && token !== "undefined") {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export const api = {
    get: async (endpoint) => {
        try {
            const headers = getHeaders();
            const res = await fetch(`${BASE_URL}${endpoint}`, { headers });

            // Handle Auth Errors Globally
            if (res.status === 401) {
                useAuthStore.getState().logout();
                return { ok: false, status: 401, error: "Unauthorized" };
            }

            if (!res.ok) {
                return { ok: false, status: res.status, error: await res.text() };
            }

            const data = await res.json();
            return { ok: true, status: res.status, ...data }; // Spread data to handle {items: []} or {bookings: []}
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            return { ok: false, status: 0, error: "Network error" };
        }
    },

    post: async (endpoint, body) => {
        try {
            const headers = getHeaders();
            
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            const data = await res.json();
            
            if (!res.ok) {
                return { ok: false, status: res.status, data }; 
            }

            return { ok: true, status: res.status, data };
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            return { ok: false, status: 0, error: "Network error" };
        }
    },

    patch: async (endpoint, body = {}) => {
        try {
            const headers = getHeaders();
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) return { ok: false, status: res.status, data };
            
            return { ok: true, status: res.status, data };
        } catch (error) {
            console.error(`PATCH ${endpoint} failed:`, error);
            return { ok: false, status: 0, error: "Network error" };
        }
    },

    delete: async (endpoint) => {
        try {
            const headers = getHeaders();
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers
            });
            
            if (!res.ok) return { ok: false, status: res.status };
            return { ok: true, status: res.status };
        } catch (error) {
            // FIX: Log the error to satisfy 'no-unused-vars'
            console.error(`DELETE ${endpoint} failed:`, error);
            return { ok: false, status: 0, error: "Network error" };
        }
    }
};