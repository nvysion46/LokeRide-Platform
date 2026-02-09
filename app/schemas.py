# RENTAL_CAR/app/schemas.py
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field

from app.models import db, User, Category, Car, Booking, Coupon, Notification


class BaseSchema(SQLAlchemyAutoSchema):
    class Meta:
        sqla_session = db.session
        load_instance = True


class UserSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = User
        include_relationships = False

    password = fields.String(load_only=True, required=False)
    password_hash = fields.String(load_only=True)


class CategorySchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = Category
        include_relationships = True


class CarSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = Car
        include_fk = True
        include_relationships = True

    category = fields.Nested(CategorySchema, dump_only=True)


class CouponSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = Coupon
        include_relationships = False


class BookingSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = Booking
        include_fk = True
        include_relationships = True

    car = fields.Nested(CarSchema, dump_only=True)
    coupon = fields.Nested(CouponSchema, dump_only=True)


class NotificationSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = Notification
        include_fk = True
        include_relationships = False
