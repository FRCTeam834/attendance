# Robotics Attendance System Setup

This application connects to a Neon PostgreSQL database to track student attendance with sign-in/sign-out functionality.

## Prerequisites

1. **Python 3.7+** - [Download here](https://python.org)
2. **Node.js 16+** - [Download here](https://nodejs.org)
3. **Neon Database** - [Sign up here](https://neon.tech)

## Quick Start

### Option 1: Automated Setup (Windows)
```bash
# Run the automated setup script
start_app.bat
```

### Option 2: Manual Setup

#### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### 2. Test Database Connection
```bash
python test_database.py
```

#### 3. Install Node.js Dependencies
```bash
npm install
```

#### 4. Start Backend Server
```bash
python backend.py
```

#### 5. Start Frontend Server (in new terminal)
```bash
npm run dev
```

## Database Configuration

The application is configured to connect to your Neon database using the connection string in `backend.py`:

```python
DATABASE_URL = "postgresql://neondb_owner:npg_Ho2N4KipPbAk@ep-orange-lake-adhvvwb0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### To update the database URL:
1. Go to your Neon dashboard
2. Copy your connection string
3. Replace the `DATABASE_URL` in `backend.py`

## Features

- ✅ **Sign In/Sign Out** - Students can sign in and out with timestamps
- ✅ **Real-time Table** - Live attendance table with all records
- ✅ **Drawing Canvas** - Digital signature capture
- ✅ **Database Integration** - Persistent storage in Neon PostgreSQL
- ✅ **Error Handling** - Comprehensive error messages and validation
- ✅ **Loading States** - User feedback during operations

## API Endpoints

- `GET /health` - Health check and database status
- `GET /attendance` - Retrieve all attendance records
- `POST /attendance` - Sign in or sign out a student

## Troubleshooting

### Database Connection Issues
1. Run `python test_database.py` to diagnose connection problems
2. Check your internet connection
3. Verify the DATABASE_URL is correct
4. Ensure your Neon database is active

### Frontend Not Loading
1. Check if Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Check if port 8080 is available

### Backend Not Starting
1. Check if Python is installed: `python --version`
2. Install dependencies: `pip install -r requirements.txt`
3. Check if port 5000 is available

## File Structure

```
attendance/
├── backend.py              # Flask backend server
├── test_database.py        # Database connection tester
├── requirements.txt        # Python dependencies
├── start_app.bat          # Windows startup script
├── src/
│   └── App.svelte         # Frontend Svelte application
├── public/                # Static assets
└── package.json           # Node.js dependencies
```

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Run the database test script
3. Verify all dependencies are installed
4. Check your Neon database status
