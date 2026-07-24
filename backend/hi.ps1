# ============================================
# Programmable Money - Backend Setup Script
# Phase 1 - Project Structure
# ============================================
Set-ExecutionPolicy -Scope Process Bypass
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Programmable Money Backend Setup"
Write-Host " Phase 1 - Folder Structure"
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Stop"

function Create-Folder {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Host "[Created] $Path" -ForegroundColor Green
    }
    else {
        Write-Host "[Exists ] $Path" -ForegroundColor Yellow
    }
}

function Create-File {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        New-Item -ItemType File -Path $Path | Out-Null
        Write-Host "[Created] $Path" -ForegroundColor Cyan
    }
    else {
        Write-Host "[Exists ] $Path" -ForegroundColor DarkYellow
    }
}

# ===================================================
# Root Files
# ===================================================

Create-File ".gitignore"
Create-File ".env"
Create-File ".env.example"
Create-File "README.md"
Create-File "package.json"
Create-File "tsconfig.json"
Create-File "nodemon.json"

# ===================================================
# Root Directories
# ===================================================

Create-Folder "src"
Create-Folder "scripts"

# ===================================================
# Source Directories
# ===================================================

$folders = @(

"src/config",

"src/controllers",

"src/routes",

"src/services",

"src/repositories",

"src/interfaces",
"src/interfaces/repositories",
"src/interfaces/services",
"src/interfaces/cbs",
"src/interfaces/ledger",
"src/interfaces/oracle",

"src/middleware",

"src/models",

"src/dto",
"src/dto/request",
"src/dto/response",

"src/validators",

"src/events",
"src/events/publisher",
"src/events/subscriber",

"src/adapters",
"src/adapters/firestore",
"src/adapters/canton",
"src/adapters/cbs",
"src/adapters/oracle",

"src/utils",

"src/enums",

"src/types",

"src/exceptions",

"src/ledger",

"src/tests",
"src/tests/unit",
"src/tests/integration",
"src/tests/mocks"

)

foreach($folder in $folders){
    Create-Folder $folder
}

# ===================================================
# Root Source Files
# ===================================================

Create-File "src/app.ts"
Create-File "src/server.ts"

# ===================================================
# Config
# ===================================================

$configFiles = @(
"env.ts",
"firestore.ts",
"logger.ts",
"cors.ts",
"security.ts",
"swagger.ts",
"constants.ts"
)

foreach($file in $configFiles){
    Create-File "src/config/$file"
}

# ===================================================
# Controllers
# ===================================================

$controllerFiles = @(
"auth.controller.ts",
"order.controller.ts",
"escrow.controller.ts",
"shipment.controller.ts",
"oracle.controller.ts",
"health.controller.ts"
)

foreach($file in $controllerFiles){
    Create-File "src/controllers/$file"
}

# ===================================================
# Routes
# ===================================================

$routeFiles = @(
"index.ts",
"auth.routes.ts",
"order.routes.ts",
"escrow.routes.ts",
"shipment.routes.ts",
"oracle.routes.ts",
"health.routes.ts"
)

foreach($file in $routeFiles){
    Create-File "src/routes/$file"
}

# ===================================================
# Services
# ===================================================

$serviceFiles = @(
"auth.service.ts",
"order.service.ts",
"escrow.service.ts",
"shipment.service.ts",
"oracle.service.ts",
"firestore.service.ts",
"cbs.service.ts",
"notification.service.ts"
)

foreach($file in $serviceFiles){
    Create-File "src/services/$file"
}

# ===================================================
# Repositories
# ===================================================

$repoFiles = @(
"user.repository.ts",
"order.repository.ts",
"escrow.repository.ts",
"shipment.repository.ts",
"audit.repository.ts"
)

foreach($file in $repoFiles){
    Create-File "src/repositories/$file"
}

# ===================================================
# Middleware
# ===================================================

$middlewareFiles = @(
"auth.middleware.ts",
"role.middleware.ts",
"validation.middleware.ts",
"error.middleware.ts",
"logger.middleware.ts",
"request-id.middleware.ts",
"idempotency.middleware.ts",
"rate-limit.middleware.ts"
)

foreach($file in $middlewareFiles){
    Create-File "src/middleware/$file"
}

# ===================================================
# Models
# ===================================================

$modelFiles = @(
"User.ts",
"Buyer.ts",
"Supplier.ts",
"Order.ts",
"Escrow.ts",
"Shipment.ts",
"AuditLog.ts"
)

foreach($file in $modelFiles){
    Create-File "src/models/$file"
}

# ===================================================
# Validators
# ===================================================

$validatorFiles = @(
"auth.validator.ts",
"order.validator.ts",
"escrow.validator.ts",
"shipment.validator.ts"
)

foreach($file in $validatorFiles){
    Create-File "src/validators/$file"
}

# ===================================================
# Ledger
# ===================================================

$ledgerFiles = @(
"canton.client.ts",
"ledger.service.ts",
"contract.mapper.ts",
"contract.events.ts",
"contract.types.ts"
)

foreach($file in $ledgerFiles){
    Create-File "src/ledger/$file"
}

# ===================================================
# Events
# ===================================================

Create-File "src/events/event.types.ts"

# ===================================================
# Utils
# ===================================================

$utils = @(
"logger.ts",
"jwt.ts",
"crypto.ts",
"date.ts",
"response.ts",
"mapper.ts",
"validator.ts"
)

foreach($file in $utils){
    Create-File "src/utils/$file"
}

# ===================================================
# Enums
# ===================================================

$enums = @(
"UserRole.ts",
"OrderStatus.ts",
"EscrowStatus.ts",
"DeliveryStatus.ts",
"PaymentStatus.ts"
)

foreach($file in $enums){
    Create-File "src/enums/$file"
}

# ===================================================
# Types
# ===================================================

$types = @(
"common.types.ts",
"auth.types.ts",
"express.d.ts"
)

foreach($file in $types){
    Create-File "src/types/$file"
}

# ===================================================
# Exceptions
# ===================================================

$exceptions = @(
"ApiError.ts",
"ValidationError.ts",
"LedgerError.ts",
"CBSException.ts"
)

foreach($file in $exceptions){
    Create-File "src/exceptions/$file"
}

# ===================================================
# Scripts
# ===================================================

$scriptFiles = @(
"seed.ts",
"firestore.ts",
"healthcheck.ts"
)

foreach($file in $scriptFiles){
    Create-File "scripts/$file"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Backend Structure Created Successfully"
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""