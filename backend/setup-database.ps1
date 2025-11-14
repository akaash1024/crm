# PowerShell script to set up PostgreSQL database for CRM
# Make sure PostgreSQL is installed and psql is in your PATH

Write-Host "Setting up CRM Database..." -ForegroundColor Green

# Database configuration
$DB_NAME = "crm_db"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"

# Check if psql is available
try {
    $psqlVersion = psql --version
    Write-Host "PostgreSQL found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: PostgreSQL (psql) is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Create database
Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow
try {
    psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database '$DB_NAME' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database might already exist (this is okay)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating database. Make sure PostgreSQL is running and credentials are correct." -ForegroundColor Red
    Write-Host "You can also create it manually:" -ForegroundColor Yellow
    Write-Host "  psql -U postgres -c `"CREATE DATABASE $DB_NAME;`"" -ForegroundColor Cyan
}

# Verify database exists
Write-Host "Verifying database..." -ForegroundColor Yellow
$dbExists = psql -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';"
if ($dbExists -match "1") {
    Write-Host "Database '$DB_NAME' exists and is ready!" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not verify database creation" -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your .env file has the correct database credentials" -ForegroundColor White
Write-Host "2. Run 'npm run dev' in the backend directory" -ForegroundColor White
Write-Host "3. The tables will be created automatically by Sequelize" -ForegroundColor White

# Clear password from environment
Remove-Item Env:\PGPASSWORD

