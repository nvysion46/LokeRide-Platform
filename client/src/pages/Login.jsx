import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ Added Link
import { useAuthStore } from '../store/authStore';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // ✅ Added loading state
    const login = useAuthStore(s => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Start loading
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Login failed: ' + (err.message || "Unknown error"));
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            {/* Form acts as the white card container */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80 space-y-4">
                <h1 className="text-2xl font-bold">Login</h1>
                <input 
                    className="w-full border p-2 rounded" 
                    placeholder="Username" 
                    onChange={e => setUsername(e.target.value)} 
                />
                <input 
                    className="w-full border p-2 rounded" 
                    type="password" 
                    placeholder="Password" 
                    onChange={e => setPassword(e.target.value)} 
                />
                
                {/* ✅ UPDATED: Button with Loading State */}
                <button 
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-70"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* ✅ NEW: Link to Register */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account? 
                    <Link to="/register" className="text-indigo-600 font-bold hover:underline ml-1">Create one</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;