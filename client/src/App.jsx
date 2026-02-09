import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore'; 

// Components
import Navbar from './components/Navbar'; 

// Pages
import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import Register from './pages/Register'; 
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CallUsPage from './pages/CallUsPage';
import AdminLogin from './pages/AdminLogin'; // ✅ Added Import

const App = () => {
    const { token, user } = useAuthStore();

    return (
        <BrowserRouter>
            <Navbar />

            <div className="pt-16">
                <Routes>
                    <Route path="/" element={<PublicHome />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
                    <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
                    
                    {/* ✅ NEW: Admin Login Route (Destination for the redirect) */}
                    <Route 
                        path="/admin-login" 
                        element={
                            token 
                                ? (user?.is_admin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)
                                : <AdminLogin />
                        } 
                    />

                    {/* Protected User Routes */}
                    <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/call-us" element={token ? <CallUsPage /> : <Navigate to="/login" />} />

                    {/* ✅ UPDATED: Protected Admin Route */}
                    <Route 
                        path="/admin" 
                        element={
                            token && user?.is_admin 
                            ? <AdminDashboard /> 
                            : <Navigate to="/admin-login" replace />  // ✅ Redirects non-admins away immediately
                        } 
                    />
                </Routes>
            </div>
            
            <Toaster position="bottom-right" />
        </BrowserRouter>
    );
};

export default App;