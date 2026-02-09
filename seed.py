# RENTAL_CAR/seed.py
from app import create_app
from app.models import db, User, Car, Category
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # 1. Create tables (Safe place to do this)
    print("Connecting to MySQL and creating tables...")
    db.create_all()

    # 2. Create an Admin User (if not exists)
    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", is_admin=True)
        admin.password_hash = generate_password_hash("admin123") 
        db.session.add(admin)
        print("✅ Admin user created: admin / admin123")

    # 3. Create a Test User
    if not User.query.filter_by(username="client").first():
        client = User(username="client", is_admin=False)
        client.password_hash = generate_password_hash("client123")
        db.session.add(client)
        print("✅ Client user created: client / client123")

    # 4. Create Basic Categories
    suv = Category.query.filter_by(name="SUV").first()
    if not suv:
        suv = Category(name="SUV")
        db.session.add(suv)
        db.session.commit() # Commit to get the ID
        print("✅ Category created: SUV")

    # 5. Create a Test Car
    if not Car.query.filter_by(slug="toyota-fortuner").first():
        car = Car(
            brand="Toyota",
            name="Fortuner",
            slug="toyota-fortuner",
            category_id=suv.id,
            transmission="AUTO",
            daily_rate=100.00,
            twelve_hour_rate=60.00,
            image="https://placehold.co/600x400?text=Toyota+Fortuner",
            status="AVAILABLE",
            quantity=2
        )
        db.session.add(car)
        print("✅ Car created: Toyota Fortuner")

    db.session.commit()
    print("\n🎉 MySQL Database setup complete!")