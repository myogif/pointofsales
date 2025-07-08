import { supabase } from '../services/supabaseClient.js';

export const getAllCredits = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase.from('credits').select(`
      *,
      sales (
        id,
        total,
        created_at,
        customer_id,
        users!sales_cashier_id_fkey (username)
      )
    `);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: credits, error } = await query;

    if (error) throw error;

    const customerCredits = {};
    let totalAllCredits = 0;

    for (const credit of credits) {
      const customerId = credit.sales.customer_id;
      if (!customerId) continue;

      if (!customerCredits[customerId]) {
        customerCredits[customerId] = {
          customer_id: customerId,
          customer_name: credit.customer_name,
          total_owed: 0,
          total_paid: 0,
          credits: [],
        };
      }

      customerCredits[customerId].total_owed += credit.amount_owed;
      customerCredits[customerId].total_paid += credit.amount_paid || 0;
      customerCredits[customerId].credits.push(credit);
    }

    const groupedCredits = Object.values(customerCredits);
    totalAllCredits = groupedCredits.reduce((acc, curr) => acc + (curr.total_owed - curr.total_paid), 0);


    res.json({
      credits: groupedCredits,
      totalAllCredits,
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
};

export const makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const { data: existingCredit, error: fetchError } = await supabase
      .from('credits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingCredit) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    const paymentAmount = parseFloat(amount);
    const newAmountPaid = (existingCredit.amount_paid || 0) + paymentAmount;
    const remainingBalance = existingCredit.amount_owed - newAmountPaid;

    let newStatus = 'partially_paid';
    let paidAt = null;

    if (remainingBalance <= 0) {
      newStatus = 'paid';
      paidAt = new Date().toISOString();
    }

    const { data: updatedCredit, error: updateError } = await supabase
      .from('credits')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: paidAt,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (newStatus === 'paid') {
      await supabase
        .from('sales')
        .update({ status: 'completed' })
        .eq('id', updatedCredit.sale_id);
    }

    res.json({
      message: 'Payment successfully recorded',
      credit: updatedCredit,
    });
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).json({ error: 'Failed to make payment' });
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
