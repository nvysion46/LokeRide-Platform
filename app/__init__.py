# RENTAL_CAR/app/__init__.py
import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate # <--- 1. Import Flask-Migrate
from app.models import db
from app.routes import register_routes
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)

    # MySQL configuration (Kept your existing MySQL config)
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+mysqldb://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET")

    # Initialize extensions
    db.init_app(app)
    Migrate(app, db) # <--- 2. Initialize Migrate with app and db
    JWTManager(app)
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

    with app.app_context():
        register_routes(app)
    
    return app