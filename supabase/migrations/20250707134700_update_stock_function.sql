CREATE OR REPLACE FUNCTION update_product_stock(product_id_in uuid, quantity_in numeric)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - quantity_in
  WHERE id = product_id_in;
END;
$$ LANGUAGE plpgsql;
