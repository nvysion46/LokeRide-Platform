import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Car, ArrowRight } from 'lucide-react';

// 1. IMPORT YOUR AUTH STORE
import { useAuthStore } from '../store/authStore'; 

const PublicHome = () => {
    const [cars, setCars] = useState([]);
    const navigate = useNavigate();

    // 2. GET THE LOGGED IN USER
    const { user } = useAuthStore(); 

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const res = await api.get('/public/cars');
                if (res.items) setCars(res.items);
            } catch (error) {
                console.error("Failed to load cars", error);
            }
        };
        fetchCars();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-indigo-700 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Drive Your Dreams</h1>
                    <p className="text-indigo-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                        Premium car rentals at unbeatable prices. Book online instantly and hit the road in style.
                    </p>
                    <Link to="/register" className="bg-white text-indigo-700 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition inline-flex items-center gap-2">
                        Get Started <ArrowRight size={20} />
                    </Link>
                </div>
            </div>

            {/* Car Listing Section */}
            <div className="max-w-7xl mx-auto py-16 px-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Featured Fleet</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cars.map(car => (
                        <div key={car.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                            <div className="h-56 bg-gray-100 relative">
                                {car.image ? (
                                    <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Car size={48} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{car.brand}</p>
                                        <h3 className="font-bold text-xl text-gray-900">{car.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-gray-900">${car.price}</span>
                                        <span className="text-xs text-gray-500">per day</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    {/* 3. CONDITIONAL BUTTON LOGIC */}
                                    {user ? (
                                        <button 
                                            onClick={() => navigate('/dashboard')}
                                            className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                                        >
                                            Book Now
                                        </button>
                                    ) : (
                                        <Link 
                                            to="/login" 
                                            className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                                        >
                                            Login to Book
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PublicHome;