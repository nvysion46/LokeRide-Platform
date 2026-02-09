import React, { useState, useEffect } from 'react';
import { X, Car, Ticket, Check } from 'lucide-react';
import { api } from '../services/api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // ✅ IMPORTED: React Router hook

const BookingModal = ({ car, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coupon, setCoupon] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const navigate = useNavigate(); // ✅ INITIALIZED: Navigation hook

    useEffect(() => {
        const fetchCoupons = async () => {
            const res = await api.get('/public/coupons');
            if (res.ok && res.items) {
                setAvailableCoupons(res.items);
            }
        };
        fetchCoupons();
    }, []);

    const handleApplyCoupon = (code) => {
        setCoupon(code);
        toast.success(`Coupon ${code} applied!`);
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!startDate || !endDate) {
            toast.error("Please select start and end dates");
            return;
        }

        setLoading(true);

        const payload = {
            car_id: car.id,
            start_time: new Date(startDate).toISOString(),
            end_time: new Date(endDate).toISOString(),
            coupon_code: coupon
        };

        const response = await api.post('/bookings/', payload);

        setLoading(false);

        if (response.ok) {
            toast.success("Booking Requested Successfully!");
            
            // ✅ UPDATED: Redirect to Call Us page with the newly created Booking ID
            // Assuming the backend returns the booking ID inside response.data.id or response.booking_id
            const newBookingId = response.data?.id || response.booking_id;
            navigate(`/call-us?bookingId=${newBookingId}`);
            
            // Note: We don't call onClose() anymore because the user is leaving the page
        } else {
            const msg = response.data?.message || "Booking failed";
            toast.error(msg);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <h3 className="font-bold text-lg text-gray-800">Book {car.brand} {car.name}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex gap-4 mb-6">
                        <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {car.image ? <img src={car.image} alt={car.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Car size={32}/></div>}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{car.transmission} • {car.fuel_type || 'Petrol'}</p>
                            <div className="mt-1">
                                <span className="text-2xl font-bold text-indigo-600">${Number(car.price).toFixed(0)}</span>
                                <span className="text-sm text-gray-400 font-normal ml-1">/ day</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleBooking} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Start</label>
                                <input type="datetime-local" className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">End</label>
                                <input type="datetime-local" className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Coupon Code</label>
                            <div className="relative">
                                <input 
                                    className="w-full border border-dashed p-2 pl-9 rounded-lg text-sm outline-none focus:border-indigo-500 uppercase font-mono" 
                                    placeholder="ENTER CODE" 
                                    value={coupon} 
                                    onChange={e => setCoupon(e.target.value.toUpperCase())} 
                                />
                                <Ticket className="absolute left-2.5 top-2.5 text-gray-400" size={16}/>
                            </div>

                            {availableCoupons.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Available Offers</p>
                                    {availableCoupons.map(c => (
                                        <div key={c.code} className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg group hover:border-indigo-300 transition-colors">
                                            <div>
                                                <span className="font-mono font-bold text-indigo-700 text-sm">{c.code}</span>
                                                <span className="text-xs text-indigo-500 ml-2 font-medium">{c.discount}% OFF</span>
                                                <div className="text-[10px] text-gray-400">Expires: {c.expiry}</div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleApplyCoupon(c.code)}
                                                className="text-xs bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 font-bold"
                                            >
                                                {coupon === c.code ? <Check size={12}/> : null}
                                                {coupon === c.code ? 'APPLIED' : 'APPLY'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70 mt-4">
                            {loading ? 'Processing...' : 'Confirm Booking'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;