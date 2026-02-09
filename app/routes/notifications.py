from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Notification, User
from app.schemas import NotificationSchema
from app.utils.responses import ok, error
from app.routes.utils import admin_required

bp = Blueprint("notifications", __name__, url_prefix="/notifications")

notifications_schema = NotificationSchema(many=True)
notification_schema = NotificationSchema()

@bp.get("/")
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return error("Invalid user identity", 422)

    notifications = (
        Notification.query.filter_by(user_id=uid)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return ok({"items": notifications_schema.dump(notifications)}, 200)

# ✅ EXISTING: Create Notification (Single or Broadcast)
@bp.post("/")
@jwt_required()
@admin_required
def create_notification():
    payload = request.get_json(silent=True) or {}
    
    message = (payload.get("message") or "").strip()
    is_broadcast = payload.get("broadcast", False)
    target_user_id = payload.get("user_id")

    if not message:
        return error("Message is required", 400)

    try:
        notifications_to_create = []

        if is_broadcast:
            users = User.query.all()
            for user in users:
                notifications_to_create.append(
                    Notification(user_id=user.id, message=message, is_read=False)
                )
        else:
            if not target_user_id:
                return error("user_id is required for single notifications", 400)
            
            target_user = User.query.get(target_user_id)
            if not target_user:
                return error(f"User ID {target_user_id} not found", 404)
            
            notifications_to_create.append(
                Notification(user_id=target_user.id, message=message, is_read=False)
            )

        db.session.add_all(notifications_to_create)
        db.session.commit()
        
        return ok({"message": f"Sent to {len(notifications_to_create)} users"}, 201)

    except Exception as e:
        db.session.rollback()
        return error(f"Failed to create notification: {str(e)}", 500)

# ✅ NEW: Edit Notification Route
@bp.patch("/<int:notification_id>")
@jwt_required()
@admin_required
def update_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return error("Notification not found", 404)

    payload = request.get_json(silent=True) or {}
    new_message = (payload.get("message") or "").strip()

    if not new_message:
        return error("Message cannot be empty", 400)

    try:
        notification.message = new_message
        db.session.commit()
        return ok({"item": notification_schema.dump(notification)}, 200)
    except Exception as e:
        db.session.rollback()
        return error(f"Update failed: {str(e)}", 500)

# ✅ NEW: Delete Notification Route
@bp.delete("/<int:notification_id>")
@jwt_required()
@admin_required
def delete_notification(notification_id):
    notification = Notification.query.get(notification_id)
    if not notification:
        return error("Notification not found", 404)

    try:
        db.session.delete(notification)
        db.session.commit()
        return ok({"message": "Deleted"}, 200)
    except Exception as e:
        db.session.rollback()
        return error(str(e), 500)

# ✅ EXISTING: Mark as Read (For User)
@bp.patch("/<int:notification_id>/read")
@jwt_required()
def mark_as_read(notification_id):
    user_id = get_jwt_identity()
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return error("Invalid user identity", 422)

    notification = Notification.query.filter_by(id=notification_id, user_id=uid).first()

    if not notification:
        return error("Notification not found", 404)

    notification.is_read = True
    db.session.commit()

    return ok({"item": notification_schema.dump(notification)}, 200)