from flask import Blueprint
from datetime import datetime
from app.models import Coupon, Car
from app.utils.responses import ok

# ✅ FIX: Removed url_prefix here because it is already handled in __init__.py
bp = Blueprint("public", __name__) 

@bp.get("/cars")
def list_public_cars():
    cars = (
        Car.query.with_entities(
            Car.id,
            Car.brand,
            Car.name,
            Car.daily_rate.label("price"),
            Car.image,
            Car.status,
        )
        .filter(Car.status == "AVAILABLE")
        .order_by(Car.created_at.desc())
        .all()
    )

    items = [
        {
            "id": car.id,
            "brand": car.brand,
            "name": car.name,
            "price": float(car.price),
            "image": car.image,
            "status": car.status,
        }
        for car in cars
    ]

    return ok({"items": items, "total": len(items)}, 200)

@bp.get("/coupons")
def list_active_coupons():
    now = datetime.now()
    
    # Fetch active coupons
    coupons = (
        Coupon.query.filter(
            Coupon.active == True,
            Coupon.valid_from <= now,
            Coupon.valid_to >= now,
            Coupon.usage_count < Coupon.usage_limit
        )
        .order_by(Coupon.discount_percentage.desc())
        .all()
    )

    items = [
        {
            "code": c.code,
            "discount": float(c.discount_percentage),
            "expiry": c.valid_to.strftime("%Y-%m-%d")
        }
        for c in coupons
    ]

    return ok({"items": items}, 200)