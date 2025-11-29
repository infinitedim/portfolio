-- ============================================================================
-- PostgreSQL Initialization Script
-- This script runs when the PostgreSQL container is first created
-- ============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS portfolio;

-- Grant privileges (adjust as needed)
-- GRANT ALL PRIVILEGES ON SCHEMA portfolio TO portfolio;

-- Any initial seed data can go here
-- INSERT INTO ...

-- Note: Prisma migrations will handle the actual schema creation
-- This file is for any additional PostgreSQL setup that Prisma doesn't handle
