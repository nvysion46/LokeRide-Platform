// client/src/pages/AdminLogin.jsx
import React, { useState, useEffect } from 'react'; 
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout); 

    // ✅ Automatically clear previous session when opening Admin Login
    useEffect(() => {
        logout();
    }, [logout]); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const res = await api.post('/auth/login', formData);
            
            // Checks if the API call was successful and has an access token
            if (res.ok && res.data?.access_token) {
                
                // ✅ Check if the user is actually an Admin
                if (!res.data.user.is_admin) {
                    toast.error("Access Denied: You are not an Admin");
                    return;
                }

                setAuth(res.data.user, res.data.access_token);
                toast.success(`Welcome Administrator ${res.data.user.username}`);
                
                // ✅ Redirect specifically to Admin Dashboard
                navigate('/admin');
            } else {
                 toast.error(res.data?.message || 'Login failed'); 
            }
        } catch (error) {
            toast.error(error.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-500 p-4 rounded-full shadow-lg shadow-indigo-500/20">
                        <ShieldCheck className="text-white" size={40} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-white mb-2">Admin Portal</h2>
                <p className="text-slate-400 text-center text-sm mb-8">Secure access for authorized personnel only.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Username</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            placeholder="admin_user"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                            <input 
                                type="password" 
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50 mt-4">
                        Enter Dashboard
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/login')} className="text-slate-500 text-xs hover:text-white transition">
                        Not an admin? Go to User Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;