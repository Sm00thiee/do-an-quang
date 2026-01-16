@echo off
set PGPASSWORD=Iloveyou3
psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.hdbgaxifsgrvlfsztvrm -d postgres -f MANUAL_SETUP_JOB_TABLES.sql
pause
