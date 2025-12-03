# Database Migration Guide - SQLite to PostgreSQL/MySQL

## 🎯 Overview
This guide will help you migrate from SQLite (development) to PostgreSQL or MySQL (production).

---

## Option 1: PostgreSQL (Recommended)

### Step 1: Install PostgreSQL
```bash
# Windows (using Chocolatey)
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE banana_pos;

# Create user (optional)
CREATE USER banana_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE banana_pos TO banana_admin;
```

### Step 3: Update .env.local
```env
# Replace SQLite URL with PostgreSQL
DATABASE_URL="postgresql://banana_admin:your_secure_password@localhost:5432/banana_pos"
```

### Step 4: Update Prisma Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 5: Create Migration
```bash
# Generate migration
npx prisma migrate dev --name init_postgresql

# Or for production
npx prisma migrate deploy
```

---

## Option 2: MySQL

### Step 1: Install MySQL
```bash
# Windows (using Chocolatey)
choco install mysql

# Or download from: https://dev.mysql.com/downloads/installer/
```

### Step 2: Create Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE banana_pos;

# Create user (optional)
CREATE USER 'banana_admin'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON banana_pos.* TO 'banana_admin'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Update .env.local
```env
# Replace SQLite URL with MySQL
DATABASE_URL="mysql://banana_admin:your_secure_password@localhost:3306/banana_pos"
```

### Step 4: Update Prisma Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 5: Create Migration
```bash
# Generate migration
npx prisma migrate dev --name init_mysql

# Or for production
npx prisma migrate deploy
```

---

## Data Migration (Existing Data)

### Option A: Manual Export/Import

#### 1. Export from SQLite
```bash
# Install sqlite3 command-line tool
# Export to SQL
sqlite3 prisma/dev.db .dump > backup.sql
```

#### 2. Convert and Import
```bash
# For PostgreSQL
# Edit backup.sql to fix syntax differences
psql -U banana_admin -d banana_pos -f backup.sql

# For MySQL
mysql -u banana_admin -p banana_pos < backup.sql
```

### Option B: Using Prisma (Recommended for small datasets)

```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLitePrisma } from '@prisma/client';
import { PrismaClient as PostgresPrisma } from '@prisma/client';

const sqlite = new SQLitePrisma({
  datasources: { db: { url: 'file:./dev.db' } }
});

const postgres = new PostgresPrisma({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function migrateData() {
  // Migrate companies
  const companies = await sqlite.company.findMany();
  for (const company of companies) {
    await postgres.company.create({ data: company });
  }
  
  // Migrate users
  const users = await sqlite.user.findMany();
  for (const user of users) {
    await postgres.user.create({ data: user });
  }
  
  // Continue for other models...
  
  console.log('Migration complete!');
}

migrateData();
```

---

## Post-Migration Checklist

- [ ] Test database connection: `npx prisma db pull`
- [ ] Verify all tables created: `npx prisma studio`
- [ ] Test application functionality
- [ ] Verify data integrity
- [ ] Update backup scripts
- [ ] Configure connection pooling (for production)
- [ ] Setup database monitoring

---

## Connection Pooling (Production)

### PostgreSQL with PgBouncer
```env
# Use connection pooler
DATABASE_URL="postgresql://user:password@localhost:6432/banana_pos?pgbouncer=true"
```

### Prisma Connection Pool Settings
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  // Add to your connection string:
  // ?connection_limit=10&pool_timeout=20
}
```

---

## Troubleshooting

### Error: "Can't reach database server"
- Check if PostgreSQL/MySQL service is running
- Verify connection string
- Check firewall settings

### Error: "Authentication failed"
- Verify username and password
- Check user permissions

### Error: "Database does not exist"
- Create the database first
- Verify database name in connection string

### Performance Issues
- Add indexes (already done in schema)
- Configure connection pooling
- Monitor slow queries

---

## Backup Strategy (Production)

### PostgreSQL Backup
```bash
# Daily backup script
pg_dump -U banana_admin banana_pos > backup-$(date +%Y%m%d).sql

# Restore
psql -U banana_admin banana_pos < backup-20251203.sql
```

### MySQL Backup
```bash
# Daily backup script
mysqldump -u banana_admin -p banana_pos > backup-$(date +%Y%m%d).sql

# Restore
mysql -u banana_admin -p banana_pos < backup-20251203.sql
```

### Automated Backups (Windows Task Scheduler)
```powershell
# Create a PowerShell script: backup-db.ps1
$date = Get-Date -Format "yyyyMMdd"
pg_dump -U banana_admin banana_pos > "C:\backups\banana-pos-$date.sql"

# Schedule in Task Scheduler to run daily at 2 AM
```

---

## Performance Monitoring

### Enable Query Logging (PostgreSQL)
```sql
-- In postgresql.conf
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000  -- Log queries > 1 second
```

### Enable Slow Query Log (MySQL)
```sql
-- In my.cnf or my.ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 1  -- Log queries > 1 second
```

---

## Need Help?

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- MySQL Documentation: https://dev.mysql.com/doc/
- Prisma Migration Guide: https://www.prisma.io/docs/guides/migrate
