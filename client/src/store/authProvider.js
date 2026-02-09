const API_URL = 'http://localhost:5000';

const authProvider = {
    login: async ({ username, password }) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) throw new Error('Login failed');
        const { access_token } = await response.json();
        localStorage.setItem('access_token', access_token);
    },
    logout: () => {
        localStorage.removeItem('access_token');
        return Promise.resolve();
    },
    checkError: ({ status }) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem('access_token');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    checkAuth: () => localStorage.getItem('access_token') ? Promise.resolve() : Promise.reject(),
    getPermissions: () => Promise.resolve(),
};
export default authProvider;