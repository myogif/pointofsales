import { supabase } from '../services/supabaseClient.js';

export const getAllCredits = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('credits')
      .select(`
        *,
        sales (
          id,
          total,
          created_at,
          users!sales_cashier_id_fkey (username)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: credits, error } = await query;

    if (error) throw error;

    res.json(credits);
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
};

export const markCreditAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: credit, error } = await supabase
      .from('credits')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!credit) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    // Update the related sale status
    await supabase
      .from('sales')
      .update({ status: 'completed' })
      .eq('id', credit.sale_id);

    res.json({
      message: 'Credit marked as paid',
      credit
    });
  } catch (error) {
    console.error('Error updating credit:', error);
    res.status(500).json({ error: 'Failed to update credit' });
  }
};

export const getCreditById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: credit, error } = await supabase
      .from('credits')
      .select(`
        *,
        sales (
          *,
          users!sales_cashier_id_fkey (username),
          sale_details (
            *,
            products (name, barcode, image_url)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!credit) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    res.json(credit);
  } catch (error) {
    console.error('Error fetching credit:', error);
    res.status(500).json({ error: 'Failed to fetch credit' });
  }
};