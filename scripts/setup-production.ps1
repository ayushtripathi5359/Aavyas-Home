# One-time production setup: creates the database tables, loads the starter content and creates your first Super Admin.
# Run from the project folder:   powershell -ExecutionPolicy Bypass -File scripts\setup-production.ps1
# You will be asked for the database address and the admin login. Nothing is saved to disk.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Aavya's Home - production setup" -ForegroundColor Cyan
Write-Host "Paste the Postgres connection string from Neon/Supabase (starts with postgresql://)."
$db = Read-Host "DATABASE_URL"
if ($db -notmatch "^postgres(ql)?://") { throw "That does not look like a Postgres connection string." }
if ($db -match "localhost|127\.0\.0\.1") { throw "That points at your own computer. Use the hosted database address." }

$email = Read-Host "Admin email (you will log in with this)"
$pw1 = Read-Host "Admin password (10+ characters, letters and numbers)" -AsSecureString
$pw = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pw1))

$env:DATABASE_URL = $db
$env:INITIAL_ADMIN_EMAIL = $email
$env:INITIAL_ADMIN_PASSWORD = $pw

Write-Host ""
Write-Host "1/3 Creating tables..." -ForegroundColor Yellow
npm run db:deploy
if ($LASTEXITCODE -ne 0) { throw "Creating tables failed. Check the connection string (it usually needs ?sslmode=require at the end)." }

Write-Host "2/3 Loading starter content (rooms, amenities, photos)..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) { throw "Seeding failed." }

Write-Host "3/3 Creating your admin login..." -ForegroundColor Yellow
npm run admin:create
if ($LASTEXITCODE -ne 0) { Write-Host "Admin was not created (one may already exist)." -ForegroundColor DarkYellow }

Remove-Item Env:DATABASE_URL, Env:INITIAL_ADMIN_EMAIL, Env:INITIAL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Done. Open your site's /api/health page to confirm, then sign in at /admin/login." -ForegroundColor Green
