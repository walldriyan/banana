# Environment Configuration for Electron Desktop App

## Setup Instructions

Create a `.env.local` file in the root directory with the following content:

```env
# App Mode: "web" or "desktop"
NEXT_PUBLIC_APP_MODE=web

# Desktop specific settings (only used in desktop mode)
NEXT_PUBLIC_SILENT_PRINT_ENABLED=false

# Database
DATABASE_URL="file:./prisma/dev.db"
```

## Modes

- **Web Mode**: `NEXT_PUBLIC_APP_MODE=web` - Runs as a normal Next.js web application
- **Desktop Mode**: `NEXT_PUBLIC_APP_MODE=desktop` - Runs as an Electron desktop application with silent printing

## For Desktop Development

Use `.env.desktop` file:
```env
NEXT_PUBLIC_APP_MODE=desktop
NEXT_PUBLIC_SILENT_PRINT_ENABLED=true
DATABASE_URL="file:./prisma/dev.db"
```
