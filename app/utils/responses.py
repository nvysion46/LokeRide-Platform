# RENTAL_CAR/app/utils/responses.py
from flask import jsonify


def ok(data=None, status_code: int = 200):
    payload = data if data is not None else {}
    return jsonify(payload), status_code


def error(message: str, status_code: int):
    return jsonify({"message": message}), status_code
