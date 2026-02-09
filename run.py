# RENTAL_CAR/run.py
from app import create_app
from app.models import db, Booking, BookingStatus
from datetime import datetime, timedelta, timezone # ✅ Added timezone
from apscheduler.schedulers.background import BackgroundScheduler

# Initialize the Flask App
app = create_app()

def auto_reject_bookings():
    with app.app_context():
        # ✅ FIX: Use timezone-aware UTC datetime (fixes DeprecationWarning)
        now_utc = datetime.now(timezone.utc)
        five_mins_ago = now_utc - timedelta(minutes=5)
        
        # Find all PENDING bookings created before that time
        # Convert five_mins_ago to naive datetime for MySQL compatibility
        five_mins_ago_naive = five_mins_ago.replace(tzinfo=None)

        expired_bookings = Booking.query.filter(
            Booking.status == BookingStatus.PENDING,
            Booking.created_at <= five_mins_ago_naive
        ).all()

        if expired_bookings:
            for booking in expired_bookings:
                booking.status = BookingStatus.CANCELLED
                print(f"[AUTO-REJECT] Booking #{booking.id} expired after 5 minutes.")
            
            db.session.commit()

# Start the Background Scheduler
scheduler = BackgroundScheduler()
# Run the check every 1 minute
scheduler.add_job(func=auto_reject_bookings, trigger="interval", minutes=1)
scheduler.start()

if __name__ == "__main__":
    import os
    try:
        app.run(debug=True)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()