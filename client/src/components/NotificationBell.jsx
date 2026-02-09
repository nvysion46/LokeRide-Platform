import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api'; 

const NotificationBell = () => {
    const { token } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const handleData = (response) => {
        // Check if response.items exists (based on updated api structure)
        if (response.ok && Array.isArray(response.items)) {
            setNotifications(response.items);
            setUnreadCount(response.items.filter(n => !n.is_read).length);
        }
    };

    useEffect(() => {
        if (!token || token === "null") return;

        const fetchInternal = async () => {
            // ✅ Add trailing slash
            const data = await api.get('/notifications/');
            handleData(data);
        };

        fetchInternal();
        const interval = setInterval(fetchInternal, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const handleManualRefresh = async () => {
        const data = await api.get('/notifications/');
        handleData(data);
    };

    const markRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        await api.patch(`/notifications/${id}/read`);
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
                        <button onClick={handleManualRefresh} className="text-xs text-indigo-600 hover:underline">Refresh</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-400 text-xs py-4">No notifications</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => markRead(n.id)} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                                    <p className="text-sm text-gray-800">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;