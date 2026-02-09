# RENTAL_Car/app/routes/__init__.py
from .auth import bp as auth_bp
from .bookings import bp as bookings_bp
from .admin import bp as admin_bp
from .public import bp as public_bp
from .notifications import bp as notifications_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(bookings_bp, url_prefix="/bookings")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(public_bp, url_prefix="/public")
    app.register_blueprint(notifications_bp, url_prefix="/notifications")