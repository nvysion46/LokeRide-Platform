# RENTAL_CAR/app/routes/auth.py
import re
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User
from app.schemas import UserSchema
from app.utils.responses import ok, error

bp = Blueprint("auth", __name__, url_prefix="/auth")
user_schema = UserSchema()

# ✅ STRONG PASSWORD VALIDATOR
def is_strong_password(password):
    """
    Enforce strong password policy:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character (@$!%*?&)
    """
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[@$!%*?&]", password):
        return False
    return True

@bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    # 1. Validation
    if not username or not password:
        return error("Username and password are required", 400)

    # 2. Check Password Strength
    if not is_strong_password(password):
        return error(
            "Password must be at least 8 chars long and include uppercase, lowercase, number, and special char (@$!%*?&)", 
            400
        )

    # 3. Check if user exists
    if User.query.filter_by(username=username).first():
        return error("Username already taken", 409)

    # 4. Create User (Default to Client Role)
    try:
        new_user = User(username=username)
        new_user.set_password(password) # Hashes the password securely
        
        db.session.add(new_user)
        db.session.commit()

        # Optional: Auto-login after register
        access_token = create_access_token(
            identity=str(new_user.id), # ✅ Cast to string
            additional_claims={"is_admin": new_user.is_admin}
        )

        return ok({
            "message": "Registration successful",
            "access_token": access_token, 
            "user": user_schema.dump(new_user)
        }, 201)

    except Exception as e:
        db.session.rollback()
        return error(f"Registration failed: {str(e)}", 500)

@bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return error("Username and password are required", 400)

    user = User.query.filter_by(username=username).first()
    
    # Secure password check using hash
    if not user or not user.check_password(password):
        return error("Invalid credentials", 401)

    # ✅ CRITICAL: Passing Admin Status to Token
    additional_claims = {"is_admin": user.is_admin}

    access_token = create_access_token(
        identity=str(user.id), # ✅ Cast to string for safety
        additional_claims=additional_claims 
    )
    
    return ok({
        "message": "Login successful", 
        "access_token": access_token, 
        "user": user_schema.dump(user)
    }, 200)

@bp.get("/me")
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return error("User not found", 404)
    return ok({"user": user_schema.dump(user)}, 200)