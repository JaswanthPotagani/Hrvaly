@echo off
set "DATABASE_URL=postgresql://margi:npg_digoGqMb24xE@ep-nameless-feather-ad6tn4kj-pooler.c-2.us-east-1.aws.neon.tech/margi?sslmode=require&pgbouncer=true"
node scripts/test-db-badge.js
