#!/usr/bin/env python3
"""
Test script to verify Neon database connection
Run this before starting the main application
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend import app, db, Attendance
import logging

def test_database_connection():
    """Test the database connection and basic operations"""
    print("Testing Neon database connection...")
    
    with app.app_context():
        try:
            # Test 1: Basic connection
            print("1. Testing basic connection...")
            from sqlalchemy import text
            db.session.execute(text("SELECT 1"))
            print("   [OK] Database connection successful")
            
            # Test 2: Table creation
            print("2. Testing table creation...")
            db.create_all()
            print("   [OK] Tables created/verified successfully")
            
            # Test 3: Insert test record
            print("3. Testing data insertion...")
            test_student = Attendance(
                name="Test User",
                total_hours=0.0
            )
            db.session.add(test_student)
            db.session.commit()
            print("   [OK] Test record inserted successfully")
            
            # Test 4: Query test record
            print("4. Testing data retrieval...")
            retrieved = Attendance.query.filter_by(name="Test User").first()
            if retrieved:
                print(f"   [OK] Test record retrieved: {retrieved.name}")
            else:
                print("   [FAIL] Failed to retrieve test record")
                return False
            
            # Test 5: Clean up test record
            print("5. Cleaning up test data...")
            db.session.delete(retrieved)
            db.session.commit()
            print("   [OK] Test data cleaned up")
            
            print("\n[SUCCESS] All database tests passed! Your Neon connection is working correctly.")
            return True
            
        except Exception as e:
            print(f"\n[ERROR] Database test failed: {e}")
            print("\nTroubleshooting tips:")
            print("1. Check your internet connection")
            print("2. Verify the DATABASE_URL in backend.py is correct")
            print("3. Ensure your Neon database is active")
            print("4. Check if your IP is whitelisted in Neon (if required)")
            return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    success = test_database_connection()
    sys.exit(0 if success else 1)
