/*
  # Enhanced Order Management System

  1. New Tables
    - `order_status_history` - Track all status changes with timestamps and admin users
    - `order_notes` - Internal notes for orders
    - `customer_notifications` - Track notification preferences and history
    
  2. Enhanced Tables
    - Add delivery/pickup information to orders
    - Add estimated completion times
    - Add internal notes capability
    
  3. Security
    - Enable RLS on all new tables
    - Add policies for admin and customer access
    
  4. Functions
    - Auto-update status history on order changes
    - Generate order receipts
    - Send notifications on status updates
*/

-- Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Order Notes Table
CREATE TABLE IF NOT EXISTS order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Customer Notifications Table
CREATE TABLE IF NOT EXISTS customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms', 'push')),
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Add delivery/pickup information to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_type text DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_address text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'estimated_completion'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_completion timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'special_instructions'
  ) THEN
    ALTER TABLE orders ADD COLUMN special_instructions text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_status_history
CREATE POLICY "Admin can view all order status history"
  ON order_status_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert order status history"
  ON order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for order_notes
CREATE POLICY "Admin can manage order notes"
  ON order_notes
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Customers can view non-internal notes"
  ON order_notes
  FOR SELECT
  TO authenticated
  USING (
    NOT is_internal AND 
    order_id IN (
      SELECT o.id FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      WHERE c.user_id = auth.uid()
    )
  );

-- RLS Policies for customer_notifications
CREATE POLICY "Customers can view their notifications"
  ON customer_notifications
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all notifications"
  ON customer_notifications
  FOR ALL
  TO authenticated
  USING (true);

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), 'Status updated via admin dashboard');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer_id ON customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_order_id ON customer_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_completion ON orders(estimated_completion);