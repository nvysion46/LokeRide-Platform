// client/src/pages/CallUsPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Phone, Clock, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api'; // ✅ Import API to check status

const CallUsPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('bookingId');
    
    // ✅ 1. Set timer for 5 Minutes (300 seconds)
    const [timeLeft, setTimeLeft] = useState(60); 
    const [status, setStatus] = useState('PENDING'); // Track status locally

    // ✅ 2. Countdown Timer Logic
    useEffect(() => {
        if (status !== 'PENDING') return; // Stop timer if status changes

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    // ✅ 3. Status Polling (Checks Server every 3 seconds)
    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Fetch the specific booking
                const res = await api.get(`/bookings/${bookingId}`);
                if (res && res.status) {
                    setStatus(res.status); // Update status (APPROVED, CANCELLED, or PENDING)
                    
                    // If backend says it's cancelled (due to timeout or admin), set timer to 0
                    if (res.status === 'CANCELLED') {
                        setTimeLeft(0);
                    }
                }
            } catch (error) {
                console.error("Error checking status:", error);
            }
        };

        // Run immediately then every 3 seconds
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, [bookingId]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Determine UI state
    const isExpired = timeLeft === 0 || status === 'CANCELLED';
    const isApproved = status === 'APPROVED';

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-100 animate-in zoom-in duration-300">
                
                {/* Header Icon Changes based on Status */}
                <div className="flex justify-center mb-4">
                    {isApproved ? (
                        <div className="bg-green-100 p-3 rounded-full animate-bounce">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                    ) : isExpired ? (
                        <div className="bg-red-100 p-3 rounded-full">
                            <XCircle className="text-red-600" size={32} />
                        </div>
                    ) : (
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <Clock className="text-yellow-600" size={32} />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {isApproved ? 'Booking Approved!' : isExpired ? 'Booking Cancelled' : 'Booking Reserved!'}
                </h1>
                
                <p className="text-gray-500 text-sm mb-1">Booking ID: <span className="font-mono font-bold text-gray-700">#{bookingId}</span></p>
                
                <p className="text-gray-600 mb-6 mt-2">
                    {isApproved 
                        ? "Your vehicle is ready! You can view details in your dashboard."
                        : isExpired 
                            ? "This booking was cancelled by the admin or the time expired."
                            : "To confirm your vehicle, please call us immediately to finalize your payment."}
                </p>
                
                {/* Call Button (Hidden if Approved, Disabled if Expired) */}
                {!isApproved && (
                    <a 
                        href="tel:+919876543210" 
                        className={`flex items-center justify-center gap-2 text-white py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg w-full mb-6 ${isExpired ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                        onClick={(e) => isExpired && e.preventDefault()}
                    >
                        <Phone size={24} />
                        +91 98765 43210
                    </a>
                )}

                {/* Countdown Timer Display */}
                {!isApproved && (
                    <div className={`p-4 rounded-xl flex items-center justify-center gap-3 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                        <Clock className={isExpired ? "text-red-500" : "text-orange-500"} size={24} />
                        <div className="text-left">
                            <p className={`text-xs font-bold uppercase tracking-wider ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                {isExpired ? 'Status' : 'Time Remaining'}
                            </p>
                            <p className={`text-2xl font-mono font-bold ${isExpired ? 'text-red-700' : 'text-orange-700'}`}>
                                {isExpired ? 'CANCELLED' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Navigation */}
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 flex items-center justify-center gap-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition mx-auto"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default CallUsPage;