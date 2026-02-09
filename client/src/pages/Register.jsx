import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus, User, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // We use the api wrapper to handle the request
            const res = await api.post('/auth/register', {
                username: formData.username,
                password: formData.password
            });

            // ✅ Success Case (201 Created)
            if (res.ok && res.data) {
                toast.success("Account created successfully!");
                
                // Optional: Auto-login after register
                if (res.data.access_token) {
                    setAuth(res.data.user, res.data.access_token);
                    navigate('/dashboard');
                } else {
                    navigate('/login');
                }
            } else {
                // ❌ Handle Backend Errors (like 409 Conflict)
                toast.error(res.data?.message || "Registration failed. Try a different username.");
            }
        } catch (error) {
            // Catch network errors or unexpected crashes
            console.error("Registration Error:", error);
            toast.error(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300">
                
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-500 p-4 rounded-full shadow-lg shadow-indigo-500/20">
                        <UserPlus className="text-white" size={32} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-white mb-2">Create Account</h2>
                <p className="text-slate-400 text-center text-sm mb-8">Join LokeRide to start booking.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                required
                            />
                        </div>
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
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-500" size={16} />
                            <input 
                                type="password" 
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Register'} <ArrowRight size={18} />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;