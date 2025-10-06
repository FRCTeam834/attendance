# ----------------------------------------
# ROBOTICS TEAM ATTENDANCE BACKEND (Neon Ready)
# ----------------------------------------

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz

# --- Initialize app ---
app = Flask(__name__)

# Allow Svelte frontend
CORS(app, origins=["http://localhost:8080", "http://127.0.0.1:8080"], supports_credentials=True)

# --- Neon Database URL (Correct format) ---
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql://neondb_owner:npg_Ho2N4KipPbAk@"
    "ep-orange-lake-adhvvwb0-pooler.c-2.us-east-1.aws.neon.tech/"
    "neondb?sslmode=require"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# --- Model ---
class Attendance(db.Model):
    __tablename__ = "attendance"  # Must match Neon table

    name = db.Column(db.String(100), primary_key=True)
    signin_time = db.Column(db.DateTime, nullable=True)
    signout_time = db.Column(db.DateTime, nullable=True)
    total_hours = db.Column(db.Float, default=0.0)

# --- Helper for Eastern timezone ---
def eastern_now():
    return datetime.now(pytz.timezone("US/Eastern"))

# --- POST endpoint ---
@app.route("/attendance", methods=["POST"])
def attendance():
    try:
        data = request.get_json()
        name = data.get("name")
        action = data.get("action")

        if not name or name == "Select User":
            return jsonify({"error": "Please select a valid name."}), 400
        if action not in ["Sign In", "Sign Out"]:
            return jsonify({"error": "Invalid action."}), 400

        user = Attendance.query.filter_by(name=name).first()
        if not user:
            return jsonify({"error": f"{name} not found in database."}), 404

        now = eastern_now()

        if action == "Sign In":
            user.signin_time = now
            db.session.commit()
            return jsonify({
                "message": f"{name} signed in successfully.",
                "signin_time": now.strftime("%Y-%m-%d %H:%M:%S")
            })

        if action == "Sign Out":
            if not user.signin_time:
                return jsonify({"error": f"{name} has not signed in yet."}), 400

            session_hours = (now - user.signin_time).total_seconds() / 3600
            user.signout_time = now
            user.total_hours += session_hours
            user.signin_time = None
            db.session.commit()

            return jsonify({
                "message": f"{name} signed out successfully.",
                "signout_time": now.strftime("%Y-%m-%d %H:%M:%S"),
                "session_hours": round(session_hours, 2),
                "total_hours": round(user.total_hours, 2)
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- GET endpoint ---
@app.route("/attendance", methods=["GET"])
def get_all():
    users = Attendance.query.order_by(Attendance.name).all()
    data = []
    for u in users:
        data.append({
            "name": u.name,
            "signin_time": u.signin_time.strftime("%Y-%m-%d %H:%M:%S") if u.signin_time else "",
            "signout_time": u.signout_time.strftime("%Y-%m-%d %H:%M:%S") if u.signout_time else "",
            "total_hours": round(u.total_hours or 0.0, 2)
        })
    return jsonify(data)

# --- Run server ---
if __name__ == "__main__":
    print("🚀 Flask backend running at http://127.0.0.1:5000")
    app.run(debug=True, host="127.0.0.1", port=5000)
