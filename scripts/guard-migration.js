/**
 * MIGRATION GUARD
 * Runs before any `prisma migrate dev` or `prisma db push` command.
 * If the DATABASE_URL points to production (Supabase), it ABORTS immediately.
 */

const fs = require('fs')
const path = require('path')

// Load .env manually
const envPath = path.resolve(__dirname, '../.env')
const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
let dbUrl = ''
for (const line of lines) {
    const match = line.match(/^DATABASE_URL="?([^"]+)"?/)
    if (match) { dbUrl = match[1]; break }
}

const PRODUCTION_SIGNALS = [
    'supabase.com',
    'pooler.supabase',
    'aws-1-eu-west',
    'neon.tech',
    'railway.app',
    'render.com',
]

const isProduction = PRODUCTION_SIGNALS.some(signal => dbUrl.includes(signal))

if (isProduction) {
    console.error('\n')
    console.error('╔══════════════════════════════════════════════════════════╗')
    console.error('║           🚨  MIGRATION BLOCKED — PRODUCTION DB  🚨      ║')
    console.error('╠══════════════════════════════════════════════════════════╣')
    console.error('║  Your DATABASE_URL is pointing to a PRODUCTION database. ║')
    console.error('║  Running `prisma migrate dev` here WILL wipe your data.  ║')
    console.error('║                                                           ║')
    console.error('║  To apply migrations to production safely, use:          ║')
    console.error('║    npm run db:deploy                                      ║')
    console.error('║                                                           ║')
    console.error('║  To work locally, keep DATABASE_URL as SQLite:           ║')
    console.error('║    DATABASE_URL="file:./prisma/dev.db"                   ║')
    console.error('╚══════════════════════════════════════════════════════════╝')
    console.error('\n')
    process.exit(1)
}

console.log('✅ Guard passed: DATABASE_URL is local. Safe to migrate.')
