import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
    Car, CalendarRange, Ticket, Bell, Plus, Search, Trash2, Edit, X, 
    Link as LinkIcon, Menu, CheckCircle, XCircle, DollarSign, User, Hash, Users, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000';

const getStatusColor = (status) => {
    switch (status) {
        case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'RENTED': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'MAINTENANCE': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
        case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
        case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const NavItem = ({ icon: Icon, label, isActive, onClick, isOpen }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
            isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
    >
        <Icon size={20} /> 
        <span className={`font-medium ${!isOpen && 'hidden md:hidden'}`}>{label}</span>
    </button>
);

const AdminDashboard = () => {
    const { token, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bookings'); 
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Unified Data State
    const [data, setData] = useState([]); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- FORMS ---
    const initialCarForm = {
        brand: '', name: '', slug: '', category_id: 1, 
        daily_rate: '', twelve_hour_rate: '', transmission: 'AUTO', status: 'AVAILABLE',
        image: '', quantity: 1, number_plate: ''
    };
    const [carForm, setCarForm] = useState(initialCarForm);
    
    const initialCouponForm = {
        code: '', discount_percentage: '', valid_from: '', valid_to: '', usage_limit: 10
    };
    const [couponForm, setCouponForm] = useState(initialCouponForm);

    const initialNotifForm = { user_id: '', message: '', broadcast: false };
    const [notifForm, setNotifForm] = useState(initialNotifForm);

    const [editingItem, setEditingItem] = useState(null);

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            let endpoint = '';
            // Map tabs to endpoints
            if (activeTab === 'cars') endpoint = '/admin/cars';
            else if (activeTab === 'bookings') endpoint = '/admin/bookings';
            else if (activeTab === 'coupons') endpoint = '/admin/coupons';
            else if (activeTab === 'notifications') endpoint = '/notifications/';
            else if (activeTab === 'users') endpoint = '/admin/users'; 

            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                const result = await res.json();
                // Handle different response structures gracefully
                setData(result.items || result.bookings || result.coupons || []);
            } else {
                setData([]);
            }
        } catch {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [token, activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- ACTIONS ---
    const handleAction = async (method, endpoint, body = null) => {
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: body ? JSON.stringify(body) : null
            });
            if (!res.ok) throw new Error("Request failed");
            toast.success("Success!");
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err.message || "Action failed");
        }
    };

    const handleDelete = (id) => {
        if(!window.confirm("Are you sure? This cannot be undone.")) return;
        
        let endpoint = `/admin/${activeTab}/${id}`;
        if (activeTab === 'notifications') endpoint = `/notifications/${id}`;
        
        // ✅ ALLOW deleting users now (Restriction removed)
        
        handleAction('DELETE', endpoint);
    };

    const handleCarSubmit = (e) => {
        e.preventDefault();
        const url = editingItem ? `/admin/cars/${editingItem.id}` : '/admin/cars';
        const method = editingItem ? 'PATCH' : 'POST';
        handleAction(method, url, carForm);
    };

    const handleCouponSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...couponForm,
            valid_from: new Date(couponForm.valid_from).toISOString(),
            valid_to: new Date(couponForm.valid_to).toISOString()
        };
        const url = editingItem ? `/admin/coupons/${editingItem.id}` : '/admin/coupons';
        const method = editingItem ? 'PATCH' : 'POST';
        handleAction(method, url, payload);
    };

    const handleNotifSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            handleAction('PATCH', `/notifications/${editingItem.id}`, { message: notifForm.message });
        } else {
            handleAction('POST', '/notifications/', notifForm);
        }
    };

    // --- MODAL HELPERS ---
    const openAddModal = () => {
        setEditingItem(null);
        if(activeTab === 'cars') setCarForm(initialCarForm);
        if(activeTab === 'coupons') setCouponForm(initialCouponForm);
        if(activeTab === 'notifications') setNotifForm(initialNotifForm);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        if(activeTab === 'cars') setCarForm(item);
        if(activeTab === 'coupons') {
            setCouponForm({
                ...item,
                valid_from: item.valid_from ? item.valid_from.split('T')[0] : '',
                valid_to: item.valid_to ? item.valid_to.split('T')[0] : ''
            });
        }
        if(activeTab === 'notifications') {
            setNotifForm({
                user_id: item.user_id,
                message: item.message,
                broadcast: false 
            });
        }
        setIsModalOpen(true);
    };

    const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return JSON.stringify(item).toLowerCase().includes(term);
    });

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20`}>
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                    <h1 className={`font-bold text-2xl text-indigo-700 tracking-tight ${!sidebarOpen && 'hidden'}`}>LokeRide</h1>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded-lg"><Menu className="text-gray-600"/></button>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-6">
                    <NavItem icon={CalendarRange} label="Bookings" isActive={activeTab === 'bookings'} isOpen={sidebarOpen} onClick={() => setActiveTab('bookings')} />
                    <NavItem icon={Car} label="Fleet" isActive={activeTab === 'cars'} isOpen={sidebarOpen} onClick={() => setActiveTab('cars')} />
                    <NavItem icon={Users} label="Users" isActive={activeTab === 'users'} isOpen={sidebarOpen} onClick={() => setActiveTab('users')} />
                    <NavItem icon={Ticket} label="Coupons" isActive={activeTab === 'coupons'} isOpen={sidebarOpen} onClick={() => setActiveTab('coupons')} />
                    <NavItem icon={Bell} label="Notifications" isActive={activeTab === 'notifications'} isOpen={sidebarOpen} onClick={() => setActiveTab('notifications')} />
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={() => logout() || navigate('/login')} className={`flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 font-medium`}>
                        <LogOut size={20} /> <span className={`${!sidebarOpen && 'hidden'}`}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 capitalize">{activeTab} Management</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage your {activeTab} efficiently</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                className="pl-10 p-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                                placeholder="Search..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        {/* Hide Add button for Users/Bookings tabs */}
                        {(activeTab === 'cars' || activeTab === 'coupons' || activeTab === 'notifications') && (
                            <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2">
                                <Plus size={18}/> <span className="hidden md:inline">Add New</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                    {loading ? <div className="p-12 text-center text-gray-400">Loading data...</div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                    <tr>
                                        {activeTab === 'cars' && <><th className="p-5">Vehicle</th><th className="p-5">Details</th><th className="p-5">Rate</th><th className="p-5">Status</th><th className="p-5 text-right">Actions</th></>}
                                        {activeTab === 'bookings' && <><th className="p-5">ID</th><th className="p-5">Car</th><th className="p-5">Schedule</th><th className="p-5">Status</th><th className="p-5 text-right">Controls</th></>}
                                        {activeTab === 'coupons' && <><th className="p-5">Code</th><th className="p-5">Discount</th><th className="p-5">Expiry</th><th className="p-5 text-right">Actions</th></>}
                                        {activeTab === 'users' && <><th className="p-5">ID</th><th className="p-5">Username</th><th className="p-5">Role</th><th className="p-5">Total Rides</th><th className="p-5 text-right">Joined</th><th className="p-5 text-right">Actions</th></>}
                                        {activeTab === 'notifications' && <><th className="p-5">User ID</th><th className="p-5">Message</th><th className="p-5 text-right">Date</th><th className="p-5 text-right">Actions</th></>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    
                                    {/* CARS ROW */}
                                    {activeTab === 'cars' && filteredData.map(car => (
                                        <tr key={car.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <img src={car.image || 'https://placehold.co/100'} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100"/>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{car.brand} {car.name}</div>
                                                        <div className="text-xs text-gray-400">{car.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-sm text-gray-600">
                                                    <div className="flex items-center gap-1"><Hash size={12}/> {car.number_plate || 'N/A'}</div>
                                                    <div className="text-xs text-gray-400">Qty: {car.quantity || 1}</div>
                                                </div>
                                            </td>
                                            <td className="p-5 font-medium text-gray-600">${Number(car.daily_rate).toFixed(0)} <span className="text-xs font-normal">/day</span></td>
                                            <td className="p-5">
                                                <select 
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${getStatusColor(car.status)}`}
                                                    value={car.status}
                                                    onChange={(e) => handleAction('PATCH', `/admin/cars/${car.id}`, { status: e.target.value })}
                                                >
                                                    <option value="AVAILABLE">Available</option>
                                                    <option value="RENTED">Rented</option>
                                                    <option value="MAINTENANCE">Maintenance</option>
                                                </select>
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => openEditModal(car)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button>
                                                <button onClick={() => handleDelete(car.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* BOOKINGS ROW */}
                                    {activeTab === 'bookings' && filteredData.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50/50">
                                            <td className="p-5 text-xs text-gray-400 font-mono">#{b.id}</td>
                                            <td className="p-5 font-medium text-gray-800">{b.car?.brand} {b.car?.name}</td>
                                            <td className="p-5">
                                                <div className="flex flex-col text-sm">
                                                    <span className="text-gray-900">{new Date(b.start_time).toLocaleDateString()}</span>
                                                    <span className="text-gray-400 text-xs">to {new Date(b.end_time).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-5"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(b.status)}`}>{b.status}</span></td>
                                            <td className="p-5 text-right flex items-center justify-end gap-1">
                                                {b.status === 'PENDING' && (
                                                    <>
                                                        <button onClick={() => handleAction('PATCH', `/admin/bookings/${b.id}`, {status: 'APPROVED'})} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Approve"><CheckCircle size={16}/></button>
                                                        <button onClick={() => handleAction('PATCH', `/admin/bookings/${b.id}`, {status: 'CANCELLED'})} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Reject"><XCircle size={16}/></button>
                                                    </>
                                                )}
                                                {b.status === 'APPROVED' && (
                                                    <button onClick={() => handleAction('PATCH', `/admin/bookings/${b.id}`, {status: 'COMPLETED'})} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Complete</button>
                                                )}
                                                <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition" title="Delete Booking"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* USERS ROW */}
                                    {activeTab === 'users' && filteredData.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                            <td className="p-5 text-slate-400 font-mono">#{u.id}</td>
                                            <td className="p-5 font-bold text-slate-700">{u.username}</td>
                                            <td className="p-5">
                                                {u.is_admin ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">ADMIN</span> : <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">USER</span>}
                                            </td>
                                            <td className="p-5"><span className="bg-gray-100 px-3 py-1 rounded-full font-bold text-slate-600">{u.total_bookings} Rides</span></td>
                                            <td className="p-5 text-right text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-5 text-right">
                                                <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Delete User"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* COUPONS ROW */}
                                    {activeTab === 'coupons' && filteredData.map(c => (
                                        <tr key={c.id}>
                                            <td className="p-5 font-mono font-bold text-indigo-600">{c.code}</td>
                                            <td className="p-5 font-bold text-green-600">{c.discount_percentage}% OFF</td>
                                            <td className="p-5 text-sm text-gray-500">{new Date(c.valid_to).toLocaleDateString()}</td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => openEditModal(c)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button>
                                                <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* NOTIFICATIONS ROW */}
                                    {activeTab === 'notifications' && filteredData.map(n => (
                                        <tr key={n.id}>
                                            <td className="p-5 text-gray-600 font-mono text-xs">{n.user_id}</td>
                                            <td className="p-5 text-gray-700">{n.message}</td>
                                            <td className="p-5 text-right text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => openEditModal(n)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button>
                                                <button onClick={() => handleDelete(n.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No records found.</div>}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between mb-6">
                            <h3 className="font-bold text-xl text-gray-800">{editingItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={20}/></button>
                        </div>
                        
                        {/* CAR FORM */}
                        {activeTab === 'cars' && (
                            <form onSubmit={handleCarSubmit} className="space-y-4">
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-3 text-gray-400" size={16}/>
                                    <input className="border p-2.5 pl-10 w-full rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Image URL (http://...)" value={carForm.image} onChange={e => setCarForm({...carForm, image: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input className="border p-2.5 w-full rounded-xl text-sm" placeholder="Brand" value={carForm.brand} onChange={e => setCarForm({...carForm, brand: e.target.value})} required/>
                                    <input className="border p-2.5 w-full rounded-xl text-sm" placeholder="Model" value={carForm.name} onChange={e => setCarForm({...carForm, name: e.target.value})} required/>
                                </div>
                                <input className="border p-2.5 w-full rounded-xl text-sm" placeholder="Slug (unique-id)" value={carForm.slug} onChange={e => setCarForm({...carForm, slug: e.target.value})} required/>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Quantity</label>
                                        <input type="number" min="1" className="border p-2.5 w-full rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Qty" value={carForm.quantity} onChange={e => setCarForm({...carForm, quantity: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Number Plate</label>
                                        <input className="border p-2.5 w-full rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase" placeholder="Plate No." value={carForm.number_plate} onChange={e => setCarForm({...carForm, number_plate: e.target.value.toUpperCase()})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 text-gray-400" size={14}/>
                                        <input type="number" className="border p-2 pl-6 w-full rounded-xl text-sm" placeholder="Daily Rate" value={carForm.daily_rate} onChange={e => setCarForm({...carForm, daily_rate: e.target.value})} required/>
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 text-gray-400" size={14}/>
                                        <input type="number" className="border p-2 pl-6 w-full rounded-xl text-sm" placeholder="12hr Rate" value={carForm.twelve_hour_rate} onChange={e => setCarForm({...carForm, twelve_hour_rate: e.target.value})} required/>
                                    </div>
                                </div>
                                <button className="bg-indigo-600 text-white w-full py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Save Vehicle</button>
                            </form>
                        )}

                        {/* COUPON FORM */}
                        {activeTab === 'coupons' && (
                            <form onSubmit={handleCouponSubmit} className="space-y-4">
                                <input className="border p-2.5 w-full rounded-xl text-sm uppercase font-mono font-bold" placeholder="Code (e.g. SUMMER20)" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} required/>
                                <input type="number" className="border p-2.5 w-full rounded-xl text-sm" placeholder="Discount %" value={couponForm.discount_percentage} onChange={e => setCouponForm({...couponForm, discount_percentage: e.target.value})} required/>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Valid From</label>
                                        <input type="date" className="border p-2 w-full rounded-xl text-sm" value={couponForm.valid_from} onChange={e => setCouponForm({...couponForm, valid_from: e.target.value})} required/>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Valid To</label>
                                        <input type="date" className="border p-2 w-full rounded-xl text-sm" value={couponForm.valid_to} onChange={e => setCouponForm({...couponForm, valid_to: e.target.value})} required/>
                                    </div>
                                </div>
                                <button className="bg-green-600 text-white w-full py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">
                                    {editingItem ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </form>
                        )}

                        {/* NOTIFICATION FORM (WITH BROADCAST) */}
                        {activeTab === 'notifications' && (
                            <form onSubmit={handleNotifSubmit} className="space-y-4">
                                {!editingItem && (
                                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                        <input type="checkbox" id="broadcast" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" checked={notifForm.broadcast || false} onChange={e => setNotifForm({...notifForm, broadcast: e.target.checked, user_id: ''})} />
                                        <label htmlFor="broadcast" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Send to ALL Users</label>
                                    </div>
                                )}
                                {!notifForm.broadcast && (
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-400" size={16}/>
                                        <input type="number" className="border p-2.5 pl-10 w-full rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Target User ID (e.g., 2)" value={notifForm.user_id} onChange={e => setNotifForm({...notifForm, user_id: e.target.value})} required={!notifForm.broadcast} disabled={!!editingItem} />
                                    </div>
                                )}
                                <div>
                                    <textarea className="border p-2.5 w-full rounded-xl text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Message (e.g. 'Site maintenance scheduled for tonight')" value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} required />
                                </div>
                                <button className="bg-purple-600 text-white w-full py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200">
                                    {editingItem ? 'Update Notification' : (notifForm.broadcast ? 'Broadcast to Everyone' : 'Send Notification')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

