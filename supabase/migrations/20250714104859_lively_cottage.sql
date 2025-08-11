/*
  # Fix security audit log foreign key constraint

  1. Changes
    - Make user_id nullable in security_audit_log table to allow logging events without a user
    - This fixes the foreign key constraint violation when logging events for unauthenticated users

  2. Security
    - Maintains existing RLS policies
    - Allows audit logging for failed login attempts and other events without user context
*/

-- Make user_id nullable in security_audit_log table
ALTER TABLE security_audit_log ALTER COLUMN user_id DROP NOT NULL;