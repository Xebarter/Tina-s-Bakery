/*
  # Fix RLS Policies for User Registration

  1. Policy Updates
    - Update users table policies to allow registration
    - Fix INSERT policy for new user creation
    - Ensure proper authentication flow

  2. Security
    - Maintain security while allowing registration
    - Proper user isolation with RLS
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new policies that allow registration and proper access
CREATE POLICY "Users can insert their own profile during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure service role can manage users for system operations
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);