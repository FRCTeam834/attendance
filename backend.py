from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz
import logging
import sys

# ---------------------------
# APP SETUP
# ---------------------------
app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# ---------------------------
# DATABASE
# ---------------------------
DATABASE_URL = "postgresql://neondb_owner:npg_Ho2N4KipPbAk@ep-orange-lake-adhvvwb0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Attendance(db.Model):
    __tablename__ = "attendance"
    name = db.Column(db.String(100), primary_key=True)
    signin_time = db.Column(db.String(20), nullable=True)   # stored as "08:45:00 PM"
    signout_time = db.Column(db.String(20), nullable=True)
    total_hours = db.Column(db.Float, default=0.0)

with app.app_context():
    try:
        db.create_all()
        logging.info("Database tables created successfully.")
    except Exception as e:
        logging.error(f"Failed to create tables: {e}")

# ---------------------------
# HELPER
# ---------------------------
def get_eastern_time_naive():
    """Return Eastern time as naive datetime."""
    eastern = pytz.timezone("US/Eastern")
    now = datetime.now(eastern)
    return now.replace(tzinfo=None)

def format_time_12hr(dt):
    """Return a datetime in 12-hour format with AM/PM."""
    return dt.strftime("%I:%M:%S %p") if dt else ""

# ---------------------------
# POST: Sign In / Sign Out
# ---------------------------
@app.route("/attendance", methods=["POST"])
def attendance():
    data = request.get_json()
    logging.info(f"Received POST data: {data}")

    if not data:
        return jsonify({"error": "Invalid request, JSON required"}), 400

    name = data.get("name")
    action = data.get("action")

    if not name or name == "Select User":
        return jsonify({"error": "Name is required"}), 400
    if action not in ["Sign In", "Sign Out"]:
        return jsonify({"error": "Action must be 'Sign In' or 'Sign Out'"}), 400

    now = get_eastern_time_naive()
    time_str = format_time_12hr(now)  # 12-hour string with AM/PM

    try:
        student = Attendance.query.filter_by(name=name).first()

        if action == "Sign In":
            if student:
                student.signin_time = time_str
                student.signout_time = None
            else:
                student = Attendance(name=name, signin_time=time_str)
                db.session.add(student)

            db.session.commit()
            logging.info(f"{name} signed in at {time_str}")
            return jsonify({
                "message": f"{name} signed in",
                "signin_time": time_str
            })

        if action == "Sign Out":
            if not student or not student.signin_time:
                return jsonify({"error": f"{name} has not signed in yet"}), 400

            # Parse signin_time string back to datetime for session calculation
            # Combine today's date with signin_time for calculation
            signin_time_only = datetime.strptime(student.signin_time, "%I:%M:%S %p").time()
            signin_dt = datetime.combine(now.date(), signin_time_only)

            # If sign-in was yesterday (i.e., current time < sign-in time), adjust
            if signin_dt > now:
                signin_dt = signin_dt.replace(day=now.day - 1)

            session_hours = (now - signin_dt).total_seconds() / 3600


            student.signout_time = time_str
            student.total_hours += session_hours

            db.session.commit()
            logging.info(f"{name} signed out at {time_str}, session hours: {session_hours:.2f}")

            return jsonify({
                "message": f"{name} signed out",
                "signout_time": time_str,
                "session_hours": round(session_hours, 2),
                "total_hours": round(student.total_hours, 2)
            })

    except Exception as e:
        logging.error(f"Database error: {e}")
        return jsonify({"error": "Database operation failed"}), 500

# ---------------------------
# GET: Attendance Table
# ---------------------------
@app.route("/attendance", methods=["GET"])
def get_attendance():
    try:
        students = Attendance.query.all()
        data = []
        for s in students:
            data.append({
                "name": s.name,
                "signin_time": s.signin_time,
                "signout_time": s.signout_time,
                "total_hours": round(s.total_hours, 2)
            })
        logging.info(f"Sending attendance table with {len(data)} rows")
        return jsonify(data)
    except Exception as e:
        logging.error(f"Failed to fetch attendance: {e}")
        return jsonify({"error": "Database query failed"}), 500

# ---------------------------
# RUN
# ---------------------------
if __name__ == "__main__":
    logging.info("Starting Flask server on port 5000...")
    app.run(debug=True, host="0.0.0.0", port=5000)
