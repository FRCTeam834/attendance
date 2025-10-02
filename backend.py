from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = Flask(__name__)

# --- Database connection setup ---
# Get database URL from environment variable, or fall back to a default one
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydb")

# Connect to PostgreSQL database
conn = psycopg2.connect(DATABASE_URL)

# Use a cursor that returns rows as dictionaries instead of tuples
cursor = conn.cursor(cursor_factory=RealDictCursor)


# --- Function to save match data into the database ---
def insert_match_data(
    name,
    match_number,
    team_number,
    auton_left_community,
    autonFourthCoral,
    autonThirdCoral,
    autonSecondCoral,
    autonFirstCoral,
    auton_moved_algae,
    autonProcessor,
    autonBarge,
    teleopFourthCoral,
    teleopThirdCoral,
    teleopSecondCoral,
    teleopFirstCoral,
    teleopProcessor,
    teleopBarge,
    did_break,
    defense,
    shallow_climb,
    deep_climb,
    did_attempt_climb,
    notes,
):
    # Put all values into a list, converting to the right type if needed
    values = [
        name or None,
        int(match_number) if match_number else None,
        int(team_number) if team_number else None,
        auton_left_community or None,
        autonFourthCoral or None,
        autonThirdCoral or None,
        autonSecondCoral or None,
        autonFirstCoral or None,
        auton_moved_algae or None,
        autonProcessor or None,
        autonBarge or None,
        teleopFourthCoral or None,
        teleopThirdCoral or None,
        teleopSecondCoral or None,
        teleopFirstCoral or None,
        teleopProcessor or None,
        teleopBarge or None,
        did_break or None,
        defense or None,
        shallow_climb or None,
        deep_climb or None,
        did_attempt_climb or None,
        notes or None,
    ]

    # SQL query to insert match data into the "lehigh" table
    sql = """
    INSERT INTO lehigh (
      name, match_number, team_number,
      auton_left_community, autonFourthCoral, autonThirdCoral, autonSecondCoral, autonFirstCoral,
      auton_moved_algae, autonProcessor, autonBarge,
      teleopFourthCoral, teleopThirdCoral, teleopSecondCoral, teleopFirstCoral, teleopProcessor, teleopBarge,
      did_break, defense, shallow_climb, deep_climb, did_attempt_climb, notes
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Run the SQL command with the provided values
    cursor.execute(sql, values)

    # Save (commit) changes to the database
    conn.commit()


# --- Function to save pit scouting data into the database ---
def insert_pit_data(
    pit_team_number,
    pit_width,
    pit_length,
    pit_auton_starting_position,
    pit_fourthcoral,
    pit_thirdcoral,
    pit_secondcoral,
    pit_firstcoral,
    pit_getcoral,
    pit_algae,
    pit_barge,
    pit_processor,
    pit_left_notes,
    pit_middle_notes,
    pit_right_notes,
    pit_climb,
    pit_notes,
    pit_defense_notes,
):
    # Put all pit values into a list
    values = [
        pit_team_number or None,
        pit_width or None,
        pit_length or None,
        pit_auton_starting_position or None,
        pit_left_notes or None,
        pit_middle_notes or None,
        pit_right_notes or None,
        pit_fourthcoral or None,
        pit_thirdcoral or None,
        pit_secondcoral or None,
        pit_firstcoral or None,
        pit_getcoral or None,
        pit_algae or None,
        pit_barge or None,
        pit_processor or None,
        pit_climb or None,
        pit_notes or None,
        pit_defense_notes or None,
    ]

    # SQL query to insert pit data into the "pit_lehigh" table
    sql = """
    INSERT INTO pit_lehigh (
      pit_team_number, pit_width, pit_length,
      pit_auton_starting_position, pit_left_notes, pit_middle_notes, pit_right_notes,
      pit_fourthcoral, pit_thirdcoral, pit_secondcoral, pit_firstcoral, pit_getcoral, pit_algae,
      pit_barge, pit_processor, pit_climb, pit_notes, pit_defense_notes
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Run the SQL command with the provided values
    cursor.execute(sql, values)

    # Save (commit) changes to the database
    conn.commit()


# --- Flask API Endpoints (Routes) ---

# Route for inserting match data
@app.route("/insert_match", methods=["POST"])
def insert_match_route():
    data = request.json  # Get JSON data sent in the request
    try:
        insert_match_data(**data)  # Pass the data to our function
        return jsonify({"status": "success"}), 201  # Return success
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400  # Return error


# Route for inserting pit data
@app.route("/insert_pit", methods=["POST"])
def insert_pit_route():
    data = request.json  # Get JSON data sent in the request
    try:
        insert_pit_data(**data)  # Pass the data to our function
        return jsonify({"status": "success"}), 201  # Return success
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400  # Return error


# --- Run the Flask app ---
if __name__ == "__main__":
    app.run(debug=True)  # Start the Flask server in debug mode
