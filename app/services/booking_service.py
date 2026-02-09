# app/services/booking_service.py
from sqlalchemy import func, or_, and_
from app.models import Booking, BookingStatus
from datetime import timedelta

def is_car_available(session, car, start_time, end_time, buffer_hours=2):
    """
    Checks if a car is available by counting overlapping active bookings.
    Includes a buffer time for cleaning/turnaround.
    """
    
    # 1. Define the interval we want to book
    # We essentially "pad" the requested time to check for conflicts
    req_start = start_time
    req_end = end_time + timedelta(hours=buffer_hours) # Add buffer to the end

    # 2. Query for overlapping bookings
    # Overlap Logic: (StartA < EndB) and (EndA > StartB)
    overlapping_bookings = session.query(func.count(Booking.id)).filter(
        Booking.car_id == car.id,
        
        # Check for ACTIVE statuses only
        Booking.status.in_([
            BookingStatus.PENDING, 
            BookingStatus.APPROVED, 
            BookingStatus.CONFIRMED
        ]),
        
        # The Overlap Condition
        # We check if existing bookings overlap with our requested window
        # Note: We add buffer to the existing booking's end time as well logic-wise
        and_(
            Booking.start_time < req_end,
            Booking.end_time + timedelta(hours=buffer_hours) > req_start
        )
    ).scalar()

    # 3. The Verdict
    # If the number of overlapping bookings is LESS than the total fleet quantity,
    # then we still have a car available.
    return overlapping_bookings < car.quantity