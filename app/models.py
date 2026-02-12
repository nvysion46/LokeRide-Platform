# RENTAL_CAR/app/models.py
from datetime import datetime
from decimal import Decimal
import math

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import CheckConstraint, DateTime, Enum, event
from sqlalchemy.orm import validates
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class BookingStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    CONFIRMED = "CONFIRMED"
    MAINTENANCE = "MAINTENANCE"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

    # ✅ Added CONFIRMED to BLOCKING so these bookings block the calendar
    BLOCKING = {PENDING, APPROVED, CONFIRMED, MAINTENANCE}
    HISTORY = {COMPLETED, CANCELLED}
    
    # ✅ Fixed typo: CONFIREMD -> CONFIRMED
    ALL = (PENDING, APPROVED, CONFIRMED, MAINTENANCE, CANCELLED, COMPLETED)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(255))

    cars = db.relationship("Car", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover - repr convenience
        return f"<Category {self.name}>"


class Car(db.Model):
    __tablename__ = "cars"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(201), nullable=False, index=True)
    brand = db.Column(db.String(100), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    # 👇 ADDED FIELD HERE
    number_plate = db.Column(db.String(20), nullable=True) 

    cleaning_time = db.Column(db.Integer, nullable=False, default=1)  # hours buffer between trips

    transmission = db.Column(db.String(10), nullable=False)
    seats = db.Column(db.Integer, nullable=False, default=5)
    doors = db.Column(db.Integer, nullable=False, default=4)
    fuel_type = db.Column(db.String(50), nullable=False, default="Petrol")

    daily_rate = db.Column(db.Numeric(10, 2), nullable=False)
    twelve_hour_rate = db.Column(db.Numeric(10, 2), nullable=False)

    status = db.Column(db.String(20), nullable=False, default="AVAILABLE")
    image = db.Column(db.String(255))
    is_featured = db.Column(db.Boolean, default=False)

    features = db.Column(db.Text)
    created_at = db.Column(DateTime, default=datetime.utcnow)

    category = db.relationship("Category", back_populates="cars")
    bookings = db.relationship("Booking", back_populates="car", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("quantity >= 1", name="ck_cars_quantity_positive"),
    )

    def __repr__(self) -> str:  # pragma: no cover - repr convenience
        return f"<Car {self.brand} {self.name}>"


class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    discount_percentage = db.Column(db.Numeric(5, 2), nullable=False)
    valid_from = db.Column(DateTime, nullable=False)
    valid_to = db.Column(DateTime, nullable=False)
    usage_limit = db.Column(db.Integer, nullable=False, default=1)
    usage_count = db.Column(db.Integer, nullable=False, default=0)
    active = db.Column(db.Boolean, default=True)

    bookings = db.relationship("Booking", back_populates="coupon")

    def is_valid_for_use(self, reference_time: datetime | None = None) -> bool:
        ref = reference_time or datetime.utcnow()
        return (
            self.active
            and self.valid_from <= ref <= self.valid_to
            and self.usage_count < self.usage_limit
        )

    def __repr__(self) -> str:  # pragma: no cover - repr convenience
        return f"<Coupon {self.code}>"


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    car_id = db.Column(db.Integer, db.ForeignKey("cars.id"), nullable=False)
    coupon_id = db.Column(db.Integer, db.ForeignKey("coupons.id"))

    start_time = db.Column(DateTime, nullable=False)
    end_time = db.Column(DateTime, nullable=False)
    total_price = db.Column(db.Numeric(10, 2))
    status = db.Column(
        Enum(*BookingStatus.ALL, name="booking_status"),
        nullable=False,
        default=BookingStatus.PENDING,
        server_default=BookingStatus.PENDING,
    )
    created_at = db.Column(DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="bookings")
    car = db.relationship("Car", back_populates="bookings")
    coupon = db.relationship("Coupon", back_populates="bookings")
    notifications = db.relationship("Notification", back_populates="booking", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="ck_bookings_time_order"),
    )

    @validates("status")
    def _validate_status(self, key, value):
        # ✅ FIX: Use the ALL tuple to ensure all statuses (including CONFIRMED) are valid
        if value not in BookingStatus.ALL:
            raise ValueError(f"Invalid booking status: {value}")
        return value

    def __repr__(self) -> str:  # pragma: no cover - repr convenience
        return f"<Booking {self.id}>"


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"))
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="notifications")
    booking = db.relationship("Booking", back_populates="notifications")

    def __repr__(self) -> str:  # pragma: no cover - repr convenience
        return f"<Notification {self.id} to user {self.user_id}>"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(DateTime, default=datetime.utcnow, nullable=False)

    bookings = db.relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User {self.username}>"


def calculate_total_price(booking: Booking) -> None:
    """
    Port of Django's Booking.save pricing rules, with coupon support.
    Expects booking.car, booking.start_time, booking.end_time to be set.
    """
    if not booking.start_time or not booking.end_time or not booking.car:
        return

    diff = booking.end_time - booking.start_time
    total_hours = diff.total_seconds() / 3600

    if total_hours <= 0:
        total_hours = 1

    if total_hours <= 12:
        base_price = Decimal(booking.car.twelve_hour_rate)
    elif total_hours <= 24:
        base_price = Decimal(booking.car.daily_rate)
    else:
        days = math.ceil(total_hours / 24)
        base_price = Decimal(booking.car.daily_rate) * days

    # Apply coupon if present and valid
    if booking.coupon and booking.coupon.is_valid_for_use(booking.start_time):
        discount_pct = Decimal(booking.coupon.discount_percentage)
        discount = (discount_pct / Decimal("100")) * base_price
        base_price = base_price - discount

    booking.total_price = max(base_price, Decimal("0.00"))


@event.listens_for(Booking, "before_insert")
def booking_before_insert(mapper, connection, target: Booking):  # pragma: no cover - runtime hook
    calculate_total_price(target)


@event.listens_for(Booking, "before_update")
def booking_before_update(mapper, connection, target: Booking):  # pragma: no cover - runtime hook
    # Only recalc when relevant fields change; SQLAlchemy will provide history.
    calculate_total_price(target)