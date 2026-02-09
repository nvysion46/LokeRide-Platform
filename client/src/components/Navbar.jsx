import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, Shield, Car } from 'lucide-react';

const Navbar = () => {
    const { token, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 h-16">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                        <Car size={20} />
                    </div>
                    <span>LokeRide</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-6">
                    {!token ? (
                        <>
                            <Link to="/login" className="text-gray-500 hover:text-indigo-600 font-medium transition">
                                Login
                            </Link>
                            <Link 
                                to="/register" 
                                className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                            >
                                Register
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* Show Admin Dashboard link if user is admin */}
                            {user?.is_admin && (
                                <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition">
                                    <Shield size={18} />
                                    <span className="hidden md:inline">Admin Panel</span>
                                </Link>
                            )}

                            {/* Show User Dashboard link if NOT admin */}
                            {!user?.is_admin && (
                                <Link to="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition">
                                    <User size={18} />
                                    <span className="hidden md:inline">My Dashboard</span>
                                </Link>
                            )}

                            {/* Logout Button */}
                            <button 
                                onClick={handleLogout} 
                                className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-medium text-sm"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;