# RENTAL_CAR/app/routes/utils.py
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User # Make sure to import your User model
from app.utils.responses import error

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        # Query the DB to get the most up-to-date status
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return error("Forbidden: Admins only", 403)
            
        return fn(*args, **kwargs)

    return wrapper