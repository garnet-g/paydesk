-- ============================================================
-- SUPABASE DATABASE HARDENING SCRIPT (Safe Dynamic Version)
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qtlwyqdczntathepnpzd/sql
--
-- This version dynamically targets ALL tables in the public schema
-- so it works regardless of which tables exist.
-- ============================================================

-- 1. Enable Row Level Security on EVERY table in the public schema
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename != '_prisma_migrations'  -- keep prisma migration table accessible
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        RAISE NOTICE 'RLS enabled on: %', tbl;
    END LOOP;
END;
$$;

-- 2. Revoke all direct REST/anon access from ALL tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename != '_prisma_migrations'
    LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM anon;', tbl);
        EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated;', tbl);
        RAISE NOTICE 'Revoked anon/authenticated access on: %', tbl;
    END LOOP;
END;
$$;

-- 3. Revoke schema-level access for anon
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 4. Confirm — should show rowsecurity = TRUE for all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
