import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import BookingModal from '../components/BookingModal';
import { 
    Car, Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
    Search, User, ChevronDown, History, Hourglass, LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Status Color Helper
const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
        case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
        case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-700';
    }
};

// Countdown Timer Component
const CountdownTimer = ({ createdAt }) => {
    const calculateTimeLeft = useCallback(() => {
        if (!createdAt) return 0;
        const cleanDate = createdAt.replace('Z', '').replace(' ', 'T');
        const createdTime = new Date(cleanDate).getTime();
        const expiryTime = createdTime + (5 * 60 * 1000); 
        const now = new Date().getTime();
        return Math.max(0, Math.floor((expiryTime - now) / 1000));
    }, [createdAt]);

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]); 

    if (timeLeft <= 0) return <span className="text-red-600 font-bold text-xs animate-pulse">Expiring...</span>;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <span className="text-orange-600 font-mono font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
};

const Dashboard = () => {
    const [activeView, setActiveView] = useState('browse'); // 'browse', 'current', 'pending', 'history'
    const [cars, setCars] = useState([]);
    const [bookings, setBookings] = useState([]); 
    const [selectedCar, setSelectedCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);
    
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [carRes, bookingRes] = await Promise.all([
                    api.get('/public/cars'),
                    api.get('/bookings/')
                ]);
                
                if (carRes.items) setCars(carRes.items);
                if (bookingRes.bookings) setBookings(bookingRes.bookings);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- FILTERS ---
    const filteredCars = cars.filter(car => 
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        car.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const currentBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'CONFIRMED');
    const historyBookings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');

    // Helper to render booking list
    const renderBookingList = (list, title, emptyMsg) => (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
            {list.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <Car size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">{emptyMsg}</p>
                    <button onClick={() => setActiveView('browse')} className="text-indigo-600 font-bold mt-2 hover:underline">Book a Ride</button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {list.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                            {/* Car Image */}
                            <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {booking.car?.image ? (
                                    <img src={booking.car.image} alt={booking.car.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Car size={32}/></div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{booking.car?.brand} {booking.car?.name}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                                                {booking.status?.toUpperCase() === 'APPROVED' && <CheckCircle size={14}/>}
                                                {booking.status?.toUpperCase() === 'CANCELLED' && <XCircle size={14}/>}
                                                {booking.status}
                                            </span>
                                            
                                            {/* Countdown for Pending */}
                                            {booking.status?.toUpperCase() === 'PENDING' && booking.created_at && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                    <AlertCircle size={12} className="text-orange-500" />
                                                    <span>Expires in: </span>
                                                    <CountdownTimer createdAt={booking.created_at} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-600">₹{Number(booking.total_price || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">Total Price</p>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Calendar size={16}/></div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase">Pickup</p>
                                            <p className="font-medium">{new Date(booking.start_time).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Clock size={16}/></div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold uppercase">Dropoff</p>
                                            <p className="font-medium">{new Date(booking.end_time).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* --- TOP NAVIGATION BAR --- */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo & Search */}
                        <div className="flex items-center gap-8 flex-1">
                            <h1 onClick={() => setActiveView('browse')} className="text-2xl font-extrabold text-indigo-600 tracking-tight cursor-pointer">LokeRide</h1>
                            
                            {/* Search Bar */}
                            <div className="relative w-full max-w-md hidden md:block">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    className="pl-10 pr-4 py-2.5 w-full bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all outline-none text-sm font-medium" 
                                    placeholder="Search by car name or brand..." 
                                    value={searchTerm} 
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setActiveView('browse'); // Switch to browse when searching
                                    }} 
                                />
                            </div>
                        </div>

                        {/* Right Side: Profile Menu */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button 
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl transition-all shadow-sm"
                                >
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.username}</span>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>

                                {/* Dropdown Menu */}
                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <p className="text-sm text-gray-500">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
                                        </div>
                                        
                                        <button onClick={() => { setActiveView('current'); setProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            <Car size={16} className="text-green-500"/> Current Rides
                                        </button>
                                        <button onClick={() => { setActiveView('pending'); setProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            <Hourglass size={16} className="text-yellow-500"/> Pending Rides
                                        </button>
                                        <button onClick={() => { setActiveView('history'); setProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                            <History size={16} className="text-blue-500"/> Booking History
                                        </button>
                                        
                                        <div className="border-t border-gray-50 mt-2">
                                            <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                <LogOut size={16}/> Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* 1. BROWSE VIEW */}
                {activeView === 'browse' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Browse Fleet</h2>
                                <p className="text-gray-500 mt-1">Find the perfect car for your next journey</p>
                            </div>
                            <span className="text-sm font-medium text-gray-400">{filteredCars.length} cars available</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? <div className="col-span-3 text-center py-20 text-gray-400">Loading Fleet...</div> : filteredCars.map(car => (
                                <div key={car.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                                        {car.image ? (
                                            <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Car size={48} /></div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                                            {car.brand}
                                        </div>
                                    </div>
                                    
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-gray-800">{car.name}</h3>
                                        <div className="flex items-end gap-1 mt-2 mb-4">
                                            <span className="text-2xl font-bold text-indigo-600">₹{Number(car.daily_rate).toFixed(0)}</span>
                                            <span className="text-sm text-gray-400 mb-1">/ day</span>
                                        </div>

                                        <button 
                                            onClick={() => setSelectedCar(car)}
                                            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. CURRENT RIDES VIEW */}
                {activeView === 'current' && renderBookingList(currentBookings, "Current & Approved Rides", "You have no active rides at the moment.")}

                {/* 3. PENDING RIDES VIEW */}
                {activeView === 'pending' && renderBookingList(pendingBookings, "Pending Approval", "No bookings are currently pending.")}

                {/* 4. HISTORY VIEW */}
                {activeView === 'history' && renderBookingList(historyBookings, "Booking History", "You haven't completed any trips yet.")}

            </div>

            {/* Booking Modal */}
            {selectedCar && (
                <BookingModal 
                    car={selectedCar} 
                    onClose={() => setSelectedCar(null)} 
                />
            )}
        </div>
    );
};

export default Dashboard;