# Production Environment Variables Template
# Copy this to .env.local and fill in your production values

# Database Configuration
# For Production: Use PostgreSQL or MySQL instead of SQLite
# DATABASE_URL="postgresql://user:password@localhost:5432/banana_pos"
# DATABASE_URL="mysql://user:password@localhost:3306/banana_pos"
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
# Generate a secure secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Super Admin Credentials (Change these!)
SUPER_ADMIN_USERNAME="admin"
SUPER_ADMIN_PASSWORD="admin123"  # This will be hashed automatically
SUPER_ADMIN_NAME="Super Administrator"

# Google AI (Optional - for AI features)
GOOGLE_GENAI_API_KEY=""

# Application Settings
NODE_ENV="development"  # Change to "production" for production
PORT=3000

# Security Settings
# CORS_ORIGIN="https://yourdomain.com"
# ALLOWED_HOSTS="yourdomain.com,www.yourdomain.com"

# Logging
# LOG_LEVEL="info"  # debug, info, warn, error
# LOG_FILE="./logs/app.log"

# Backup Settings
# BACKUP_ENABLED="true"
# BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
# BACKUP_RETENTION_DAYS="30"

# Email Configuration (Optional)
# SMTP_HOST=""
# SMTP_PORT=""
# SMTP_USER=""
# SMTP_PASSWORD=""
# SMTP_FROM=""

# Payment Gateway (Optional)
# PAYMENT_GATEWAY_API_KEY=""
# PAYMENT_GATEWAY_SECRET=""

# Monitoring (Optional)
# SENTRY_DSN=""
# SENTRY_ENVIRONMENT="production"

# Performance
# CACHE_TTL="3600"  # Cache time-to-live in seconds
# MAX_UPLOAD_SIZE="10485760"  # 10MB in bytes
