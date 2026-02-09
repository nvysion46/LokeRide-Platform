from datetime import datetime, timedelta, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from app.models import db, Booking, Car, Coupon, Notification, BookingStatus
from app.schemas import BookingSchema
from app.services.booking_service import is_car_available
from app.utils.responses import ok, error

bp = Blueprint("bookings", __name__)
booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True)

# ✅ HELPER: Convert Input to IST (Indian Standard Time)
def get_ist_time():
    """Returns current time in IST"""
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

def _parse_to_ist(value: str):
    """
    Parses an ISO string (likely UTC) and converts it to Naive IST.
    Example: Input "10:00Z" (UTC) -> Becomes "15:30" (IST)
    """
    if not value or not isinstance(value, str): return None
    try:
        # 1. Parse the string to a datetime object
        # If it ends in Z, it's UTC. Replace Z with +00:00 to make it parseable as aware
        if value.endswith('Z'):
            dt_utc = datetime.fromisoformat(value.replace('Z', '+00:00'))
        else:
            dt_utc = datetime.fromisoformat(value)
        
        # 2. Add 5 hours 30 minutes to shift to IST
        # We do this manually to ensure we get a "Naive" object (no timezone tag)
        # which plays nicely with your database.
        return dt_utc.replace(tzinfo=None) + timedelta(hours=5, minutes=30)
    except ValueError:
        return None

@bp.post("/")
@jwt_required()
def create_booking():
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    car_id = payload.get("car_id")
    start_time_raw = payload.get("start_time")
    end_time_raw = payload.get("end_time")
    coupon_code = (payload.get("coupon_code") or "").strip()

    # --- 1. INPUT VALIDATION ---
    if not isinstance(car_id, int):
        return error("Invalid Car ID", 400)

    # ✅ Convert inputs to IST immediately
    start_time = _parse_to_ist(start_time_raw)
    end_time = _parse_to_ist(end_time_raw)

    if not start_time or not end_time:
        return error("Invalid date format", 400)
    
    # Rule: End time must be after Start time
    if start_time >= end_time:
        return error("End time must be after start time", 400)

    # ✅ Rule: Cannot book in the past (Compared against IST)
    # Added 5-minute grace period
    now_ist = get_ist_time()
    if start_time < (now_ist - timedelta(minutes=5)):
        return error(f"Cannot book dates in the past. Current Server Time (IST): {now_ist.strftime('%Y-%m-%d %H:%M')}", 400)

    # Rule: Minimum booking duration (e.g., 4 hours)
    duration_hours = (end_time - start_time).total_seconds() / 3600
    if duration_hours < 4:
        return error("Minimum booking duration is 4 hours", 400)

    # Rule: Maximum booking advance (e.g., 6 months)
    if start_time > now_ist + timedelta(days=180):
        return error("Cannot book more than 6 months in advance", 400)

    # --- 2. TRANSACTION & CONCURRENCY CONTROL ---
    try:
        car = Car.query.filter_by(id=car_id).with_for_update().first()
        
        if not car:
            return error("Car not found", 404)

        if car.status != 'AVAILABLE':
            return error("This vehicle is currently unavailable", 400)

        # --- 3. INVENTORY CHECK ---
        if not is_car_available(db.session, car, start_time, end_time):
             return error(f"All {car.name}s are fully booked for these dates.", 409)

        # --- 4. COUPON LOGIC ---
        coupon = None
        if coupon_code:
            coupon = Coupon.query.filter(Coupon.code.ilike(coupon_code)).with_for_update().first()
            if not coupon:
                return error("Invalid coupon code", 400)
            if not coupon.is_valid_for_use(start_time):
                return error("Coupon expired or limit reached", 400)

        # --- 5. CREATE BOOKING ---
        # The start_time and end_time here are now in IST
        booking = Booking(
            user_id=user_id,
            car_id=car.id,
            start_time=start_time,
            end_time=end_time,
            status=BookingStatus.PENDING,
        )

        if coupon:
            booking.coupon = coupon
            coupon.usage_count = (coupon.usage_count or 0) + 1

        db.session.add(booking)
        db.session.flush() 

        # --- 6. NOTIFICATION ---
        db.session.add(Notification(
            user_id=user_id,
            booking_id=booking.id,
            message=f"Booking #{booking.id} request received."
        ))

        db.session.commit()
        
        booking = Booking.query.get(booking.id)
        return ok({"booking": booking_schema.dump(booking)}, 201)

    except IntegrityError:
        db.session.rollback()
        return error("Database integrity error", 400)
    except Exception as e:
        db.session.rollback()
        print(f"Booking Error: {str(e)}")
        return error("An internal error occurred processing your booking", 500)


# ---------------------------------------------------------------------------
# EXISTING ROUTES
# ---------------------------------------------------------------------------

@bp.get("/")
@jwt_required()
def list_bookings():
    user_id = get_jwt_identity()
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()
    return ok({"bookings": bookings_schema.dump(bookings)}, 200)

@bp.get("/<int:booking_id>")
@jwt_required()
def get_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    
    # Auto-Cancellation Logic (IST Aware)
    if booking.status == BookingStatus.PENDING:
        # Use IST to calculate expiry
        limit_time = booking.created_at + timedelta(minutes=5)
        
        if get_ist_time() > limit_time:
            booking.status = BookingStatus.CANCELLED
            db.session.commit()

    status_str = booking.status.value if hasattr(booking.status, 'value') else str(booking.status)
    
    return ok({
        "status": status_str,
        "booking": booking_schema.dump(booking)
    }, 200)