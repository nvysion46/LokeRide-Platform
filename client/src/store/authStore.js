import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = 'http://localhost:5000';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,

            login: async (username, password) => {
                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Invalid credentials');
                    }

                    // SAFETY CHECK: Ensure we actually got a token before setting it
                    if (!data.access_token) {
                        throw new Error("Server response missing access token");
                    }

                    set({ 
                        token: data.access_token, 
                        user: data.user 
                    });
                    
                } catch (error) {
                    console.error("Login Error:", error);
                    throw error; // Re-throw so the UI can show a toast
                }
            },

            logout: () => {
                set({ user: null, token: null });
                // Optional: Clear local storage explicitly if needed
                localStorage.removeItem('auth-storage');
            },
        }),
        {
            name: 'auth-storage', // This must match what you cleared in DevTools
        }
    )
);