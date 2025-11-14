# Database Setup Guide

## Quick Setup

### Option 1: Using PowerShell Script (Windows)
```powershell
cd backend
.\setup-database.ps1
```

### Option 2: Using SQL Command
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE crm_db;

# Exit
\q
```

### Option 3: Using pgAdmin (GUI)
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" > "Database"
4. Name: `crm_db`
5. Owner: `postgres`
6. Click "Save"

## Verify Database Configuration

Make sure your `backend/.env` file has:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## Automatic Table Creation

When you run the backend server in development mode:
```bash
npm run dev
```

Sequelize will automatically:
- Connect to the database
- Create all tables (users, leads, activities)
- Set up relationships

## Troubleshooting

### "Database does not exist"
- Make sure PostgreSQL is running
- Verify database name in `.env` matches the created database
- Check PostgreSQL service: `Get-Service postgresql*` (Windows)

### "Password authentication failed"
- Verify `DB_USER` and `DB_PASSWORD` in `.env`
- Try resetting PostgreSQL password:
  ```sql
  ALTER USER postgres WITH PASSWORD 'postgres';
  ```

### "Connection refused"
- Make sure PostgreSQL is running
- Check if port 5432 is correct
- Verify PostgreSQL is listening on localhost

## Manual Table Creation (if needed)

If automatic creation doesn't work, you can run migrations manually, but the current setup uses Sequelize's `sync()` method which creates tables automatically in development mode.

