# CRM Database Setup Guide

## Step 1: Install PostgreSQL

### Windows Installation:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - **Port**: Keep default (5432)
   - **Superuser password**: Set to `postgres` (or remember your password)
   - **Locale**: Default is fine
4. Make sure to install **pgAdmin** (optional but helpful GUI tool)
5. Add PostgreSQL to PATH (usually done automatically)

### Verify Installation:
```powershell
# Check if PostgreSQL is installed
psql --version

# If not found, you may need to add it to PATH:
# C:\Program Files\PostgreSQL\<version>\bin
```

## Step 2: Create the Database

### Option A: Using Command Line (psql)

1. Open PowerShell or Command Prompt
2. Connect to PostgreSQL:
   ```powershell
   psql -U postgres
   ```
   (Enter password when prompted: `postgres`)

3. Create the database:
   ```sql
   CREATE DATABASE crm_db;
   ```

4. Verify it was created:
   ```sql
   \l
   ```
   (You should see `crm_db` in the list)

5. Exit:
   ```sql
   \q
   ```

### Option B: Using pgAdmin (GUI - Easier!)

1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your PostgreSQL server (password: `postgres`)
3. Right-click on **Databases** → **Create** → **Database**
4. Name: `crm_db`
5. Owner: `postgres`
6. Click **Save**

### Option C: Using PowerShell Script

```powershell
cd backend
.\setup-database.ps1
```

## Step 3: Verify Your .env File

Make sure `backend/.env` has:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## Step 4: Start the Backend Server

```powershell
cd backend
npm run dev
```

The server will:
- Connect to PostgreSQL
- Automatically create all tables (users, leads, activities)
- Start on port 5000

## Troubleshooting

### "psql: command not found"
- PostgreSQL is not installed, OR
- PostgreSQL bin folder is not in your PATH
- Solution: Add `C:\Program Files\PostgreSQL\<version>\bin` to your PATH

### "Password authentication failed"
- Wrong password in `.env` file
- Solution: Update `DB_PASSWORD` in `.env` to match your PostgreSQL password

### "Database does not exist"
- Database wasn't created
- Solution: Follow Step 2 to create the database

### "Connection refused" or "Connection timeout"
- PostgreSQL service is not running
- Solution:
  ```powershell
  # Start PostgreSQL service
  Start-Service postgresql-x64-<version>
  
  # Or find the service name:
  Get-Service -Name "*postgres*"
  ```

### "Port 5432 is already in use"
- Another PostgreSQL instance is running
- Solution: Either stop the other instance or change the port in `.env`

## Quick Test

After setup, test the connection:
```powershell
cd backend
node -e "const {sequelize} = require('./config/database'); sequelize.authenticate().then(() => console.log('✓ Database connected!')).catch(err => console.error('✗ Error:', err.message));"
```

## Next Steps

Once the database is set up and the backend is running:
1. The tables will be created automatically
2. You can register a user via the frontend
3. Start using the CRM system!

