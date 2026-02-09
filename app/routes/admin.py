# RENTAL_CAR/app/routes/admin.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity # ✅ Added get_jwt_identity
from app.models import db, Car, Coupon, Booking, BookingStatus, User
from app.routes.utils import admin_required
from app.schemas import CarSchema, CouponSchema, BookingSchema, UserSchema
from app.utils.responses import ok, error
from datetime import datetime, timedelta, timezone

bp = Blueprint("admin", __name__, url_prefix="/admin")

car_schema = CarSchema()
cars_schema = CarSchema(many=True)
coupon_schema = CouponSchema()
coupons_schema = CouponSchema(many=True)
booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True)
user_schema = UserSchema()
users_schema = UserSchema(many=True)

# --- CAR MANAGEMENT ---

@bp.get("/cars")
@jwt_required()
@admin_required
def list_cars():
    cars = Car.query.order_by(Car.created_at.desc()).all()
    return ok({"items": cars_schema.dump(cars)}, 200)

@bp.post("/cars")
@jwt_required()
@admin_required
def create_car():
    payload = request.get_json(silent=True) or {}
    try:
        car = car_schema.load(payload)
        db.session.add(car)
        db.session.commit()
        return ok({"car": car_schema.dump(car)}, 201)
    except Exception as e:
        return error(f"Error creating car: {str(e)}", 400)

@bp.patch("/cars/<int:car_id>")
@jwt_required()
@admin_required
def update_car(car_id):
    car = Car.query.get(car_id)
    if not car: return error("Car not found", 404)
    
    payload = request.get_json(silent=True) or {}
    
    if 'status' in payload: car.status = payload['status']
    if 'daily_rate' in payload: car.daily_rate = payload['daily_rate']
    if 'brand' in payload: car.brand = payload['brand']
    if 'name' in payload: car.name = payload['name']
    if 'image' in payload: car.image = payload['image']
    if 'quantity' in payload: car.quantity = int(payload['quantity'])
    if 'number_plate' in payload: car.number_plate = payload['number_plate']

    try:
        db.session.commit()
        return ok({"car": car_schema.dump(car)}, 200)
    except Exception as e:
        db.session.rollback()
        return error(str(e), 400)

@bp.delete("/cars/<int:car_id>")
@jwt_required()
@admin_required
def delete_car(car_id):
    car = Car.query.get(car_id)
    if not car: return error("Car not found", 404)
    db.session.delete(car)
    db.session.commit()
    return ok({"message": "Car deleted"}, 200)

# --- BOOKING MANAGEMENT ---

@bp.get("/bookings")
@jwt_required()
@admin_required
def list_all_bookings():
    try:
        now_utc = datetime.now(timezone.utc)
        expiration_threshold = now_utc - timedelta(minutes=1)
        
        expired_bookings = Booking.query.filter(
            Booking.status == BookingStatus.PENDING,
            Booking.created_at < expiration_threshold.replace(tzinfo=None)
        ).all()

        # Update them to CANCELLED
        if expired_bookings:
            for booking in expired_bookings:
                booking.status = BookingStatus.CANCELLED
            db.session.commit()  # Save changes before fetching list

        # ✅ 2. Fetch updated list
        bookings = Booking.query.order_by(Booking.created_at.desc()).all()
        return ok({"items": bookings_schema.dump(bookings)}, 200)

    except Exception as e:
        return error(f"Failed to fetch bookings: {str(e)}", 500)

@bp.patch("/bookings/<int:booking_id>")
@jwt_required()
@admin_required
def update_booking_status(booking_id: int):
    payload = request.get_json(silent=True) or {}
    new_status = (payload.get("status") or "").strip().upper()
    
    if new_status not in BookingStatus.ALL:
        return error(f"Invalid status. Must be {BookingStatus.ALL}", 400)

    booking = Booking.query.get(booking_id)
    if not booking: return error("Booking not found", 404)

    booking.status = new_status
    db.session.commit()
    return ok({"booking": booking_schema.dump(booking)}, 200)

@bp.delete("/bookings/<int:booking_id>")
@jwt_required()
@admin_required
def delete_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking: return error("Booking not found", 404)
    try:
        db.session.delete(booking)
        db.session.commit()
        return ok({"message": "Booking deleted"}, 200)
    except Exception as e:
        db.session.rollback()
        return error(str(e), 500)

# --- USER MANAGEMENT ---

@bp.get("/users")
@jwt_required()
@admin_required
def list_users():
    """
    Lists all users with their total booking count.
    """
    try:
        # Query users
        users = User.query.all()
        
        users_data = []
        for user in users:
            # Count ALL bookings for strict history stats
            booking_count = Booking.query.filter_by(user_id=user.id).count()
            
            user_dump = user_schema.dump(user)
            user_dump['total_bookings'] = booking_count # Add custom field for frontend
            users_data.append(user_dump)

        return ok({"items": users_data}, 200)
    except Exception as e:
        return error(f"Failed to fetch users: {str(e)}", 500)

# ✅ ADDED DELETE USER ROUTE
@bp.delete("/users/<int:user_id>")
@jwt_required()
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error("User not found", 404)
    
    try:
        # Check if deleting self
        current_user_id = get_jwt_identity()
        if user.id == current_user_id:
            return error("You cannot delete your own admin account.", 400)

        db.session.delete(user)
        db.session.commit()
        return ok({"message": "User deleted successfully"}, 200)
    except Exception as e:
        db.session.rollback()
        return error(f"Failed to delete user: {str(e)}", 500)

# --- COUPON MANAGEMENT ---

@bp.get("/coupons")
@jwt_required()
@admin_required
def list_coupons():
    coupons = Coupon.query.order_by(Coupon.id.desc()).all()
    return ok({"items": coupons_schema.dump(coupons)}, 200)

@bp.post("/coupons")
@jwt_required()
@admin_required
def create_coupon():
    payload = request.get_json(silent=True) or {}
    try:
        if 'valid_from' in payload and isinstance(payload['valid_from'], str):
            payload['valid_from'] = datetime.fromisoformat(payload['valid_from'].replace('Z', ''))
            
        if 'valid_to' in payload and isinstance(payload['valid_to'], str):
            payload['valid_to'] = datetime.fromisoformat(payload['valid_to'].replace('Z', ''))
        
        coupon = Coupon(
            code=payload.get('code'),
            discount_percentage=payload.get('discount_percentage'),
            valid_from=payload['valid_from'],
            valid_to=payload['valid_to'],
            usage_limit=payload.get('usage_limit', 10),
            active=True
        )
        
        db.session.add(coupon)
        db.session.commit()
        return ok({"coupon": coupon_schema.dump(coupon)}, 201)
    except Exception as e:
        db.session.rollback()
        return error(f"Creation failed: {str(e)}", 400)

@bp.patch("/coupons/<int:coupon_id>")
@jwt_required()
@admin_required
def update_coupon(coupon_id):
    coupon = Coupon.query.get(coupon_id)
    if not coupon: return error("Coupon not found", 404)
    
    payload = request.get_json(silent=True) or {}
    try:
        if 'code' in payload: coupon.code = payload['code']
        if 'discount_percentage' in payload: coupon.discount_percentage = payload['discount_percentage']
        if 'usage_limit' in payload: coupon.usage_limit = payload['usage_limit']
        
        # Handle date updates safely
        if 'valid_from' in payload and payload['valid_from']:
             coupon.valid_from = datetime.fromisoformat(payload['valid_from'].replace('Z', ''))
        if 'valid_to' in payload and payload['valid_to']:
             coupon.valid_to = datetime.fromisoformat(payload['valid_to'].replace('Z', ''))

        db.session.commit()
        return ok({"coupon": coupon_schema.dump(coupon)}, 200)
    except Exception as e:
        db.session.rollback()
        return error(f"Update failed: {str(e)}", 400)

@bp.delete("/coupons/<int:coupon_id>")
@jwt_required()
@admin_required
def delete_coupon(coupon_id):
    c = Coupon.query.get(coupon_id)
    if not c: return error("Not found", 404)
    try:
        db.session.delete(c)
        db.session.commit()
        return ok({"message": "Deleted"}, 200)
    except Exception as e:
        db.session.rollback()
        return error(str(e), 500)