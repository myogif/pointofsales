/*
  # Credit Payments Table

  1. New Tables
    - `credit_payments`
      - `id` (uuid, primary key)
      - `credit_id` (uuid, foreign key to credits.id)
      - `amount_paid` (decimal)
      - `paid_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on credit_payments table
    - Add policies for authenticated users

  3. Functions
    - Function to calculate total paid amount for a credit
    - Function to update credit status based on payments
*/

-- Create credit_payments table
CREATE TABLE IF NOT EXISTS credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid REFERENCES credits(id) ON DELETE CASCADE,
  amount_paid decimal(10,2) NOT NULL CHECK (amount_paid > 0),
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Allow all operations for authenticated users" ON credit_payments FOR ALL TO authenticated USING (true);

-- Function to calculate total paid for a credit
CREATE OR REPLACE FUNCTION get_credit_total_paid(credit_id_param uuid)
RETURNS decimal AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount_paid) FROM credit_payments WHERE credit_id = credit_id_param),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update credit status after payment
CREATE OR REPLACE FUNCTION update_credit_status_after_payment(credit_id_param uuid)
RETURNS void AS $$
DECLARE
  credit_record credits%ROWTYPE;
  total_paid_amount decimal;
BEGIN
  -- Get the credit record
  SELECT * INTO credit_record FROM credits WHERE id = credit_id_param;
  
  -- Calculate total paid
  total_paid_amount := get_credit_total_paid(credit_id_param);
  
  -- Update the credit record
  IF total_paid_amount >= credit_record.amount_owed THEN
    -- Fully paid
    UPDATE credits 
    SET 
      amount_paid = credit_record.amount_owed,
      status = 'paid',
      paid_at = now()
    WHERE id = credit_id_param;
  ELSE
    -- Partially paid
    UPDATE credits 
    SET 
      amount_paid = total_paid_amount,
      status = CASE 
        WHEN total_paid_amount > 0 THEN 'partially_paid'
        ELSE 'pending'
      END,
      paid_at = NULL
    WHERE id = credit_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;