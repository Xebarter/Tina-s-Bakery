/*
  # Fix User Registration Flow

  1. Security Updates
    - Update RLS policies to allow proper user registration
    - Ensure authenticated users can create their own profile
    - Add proper INSERT policy for users table

  2. Policy Changes
    - Allow authenticated users to insert their own data
    - Maintain security by checking auth.uid() = id
*/

-- Drop existing policies that might be blocking registration
DROP POLICY IF EXISTS "Users can insert their own customer data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users during registration" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create proper INSERT policy for user registration
CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure SELECT policy exists for users to read their own data
DROP POLICY IF EXISTS "Enable select for users to view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure UPDATE policy exists for users to modify their own data
DROP POLICY IF EXISTS "Enable update for users to modify own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure service role has full access
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);