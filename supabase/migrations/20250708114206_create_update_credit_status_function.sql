-- Create or replace the function to update credit status after payment
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

    -- If the credit is fully paid, update the associated sale status to 'completed'
    IF new_status = 'paid' THEN
        UPDATE sales
        SET status = 'completed'
        WHERE id = (SELECT sale_id FROM credits WHERE id = credit_id_param);
    END IF;
END;
$$ LANGUAGE plpgsql;
