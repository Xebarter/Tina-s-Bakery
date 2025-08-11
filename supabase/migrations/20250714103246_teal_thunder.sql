/*
  # Fix User Registration RLS Policy

  1. Security Changes
    - Drop existing restrictive policies that prevent user registration
    - Add proper INSERT policy for authenticated users during registration
    - Ensure users can only create their own profile (auth.uid() = id)
    - Maintain security while allowing registration flow

  2. Policy Updates
    - Allow authenticated users to insert their own profile
    - Keep existing SELECT and UPDATE policies for user data access
    - Add service role access for administrative operations
*/

-- Drop existing policies that might be blocking registration
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Create new policies that allow proper user registration flow
CREATE POLICY "Enable insert for authenticated users during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users to view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for users to modify own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full access for administrative operations
CREATE POLICY "Enable all operations for service role"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;