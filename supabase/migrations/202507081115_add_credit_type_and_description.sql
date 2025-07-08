CREATE TYPE credit_type AS ENUM ('sale_credit', 'general_credit');

ALTER TABLE credits
ALTER COLUMN sale_id DROP NOT NULL;

ALTER TABLE credits
ADD COLUMN type credit_type DEFAULT 'sale_credit';

ALTER TABLE credits
ADD COLUMN description text;

-- Update existing credits to be 'sale_credit' type
UPDATE credits
SET type = 'sale_credit'
WHERE sale_id IS NOT NULL;

-- Add a function to update credit status based on remaining amount
CREATE OR REPLACE FUNCTION update_credit_status_after_payment(credit_id_param uuid)
RETURNS void AS $$
DECLARE
    current_amount_owed numeric;
    current_total_paid numeric;
    new_status credit_status;
BEGIN
    -- Get the current amount_owed for the credit
    SELECT amount_owed INTO current_amount_owed
    FROM credits
    WHERE id = credit_id_param;

    -- Calculate the total amount paid for this credit
    SELECT COALESCE(SUM(amount_paid), 0) INTO current_total_paid
    FROM credit_payments
    WHERE credit_id = credit_id_param;

    -- Determine the new status
    IF current_total_paid >= current_amount_owed THEN
        new_status := 'paid';
    ELSIF current_total_paid > 0 AND current_total_paid < current_amount_owed THEN
        new_status := 'partially_paid';
    ELSE
        new_status := 'pending';
    END IF;

    -- Update the credit status
    UPDATE credits
    SET status = new_status,
        paid_at = CASE WHEN new_status = 'paid' THEN now() ELSE NULL END
    WHERE id = credit_id_param;
END;
$$ LANGUAGE plpgsql;

-- Drop the old update_credit_status_after_payment function if it exists
DROP FUNCTION IF EXISTS update_credit_status_after_payment(uuid);
