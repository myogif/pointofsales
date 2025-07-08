import { supabase } from '../services/supabaseClient.js';

export const getAllCredits = async (req, res) => {
  try {
    const { status } = req.query;

    // Get all credits with calculated total_paid from credit_payments
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

    // Group by customer_name and calculate totals
    const customerCredits = {};

    for (const credit of credits) {
      const customerName = credit.customer_name;
      
      if (!customerCredits[customerName]) {
        customerCredits[customerName] = {
          customer_name: customerName,
          total_owed: 0,
          total_paid: 0,
          remaining: 0,
          credit_count: 0,
          credits: [],
        };
      }

      // Get total paid from credit_payments for this credit
      const { data: payments } = await supabase
        .from('credit_payments')
        .select('amount_paid')
        .eq('credit_id', credit.id);

      const totalPaidForCredit = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount_paid), 0) || 0;
      
      customerCredits[customerName].total_owed += parseFloat(credit.amount_owed);
      customerCredits[customerName].total_paid += totalPaidForCredit;
      customerCredits[customerName].credit_count += 1;
      customerCredits[customerName].credits.push({
        ...credit,
        calculated_paid: totalPaidForCredit
      });
    }

    // Calculate remaining and filter out customers with zero remaining
    const filteredCustomers = Object.values(customerCredits)
      .map(customer => ({
        ...customer,
        remaining: customer.total_owed - customer.total_paid
      }))
      .filter(customer => customer.remaining > 0);

    res.json(filteredCustomers);
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
};

export const getTotalOutstanding = async (req, res) => {
  try {
    // Get all credits
    const { data: credits, error } = await supabase
      .from('credits')
      .select('id, amount_owed');

    if (error) throw error;

    let totalOutstanding = 0;

    for (const credit of credits) {
      // Get total paid for each credit
      const { data: payments } = await supabase
        .from('credit_payments')
        .select('amount_paid')
        .eq('credit_id', credit.id);

      const totalPaid = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount_paid), 0) || 0;
      const remaining = parseFloat(credit.amount_owed) - totalPaid;
      
      if (remaining > 0) {
        totalOutstanding += remaining;
      }
    }

    res.json({ total_outstanding: totalOutstanding });
  } catch (error) {
    console.error('Error calculating total outstanding:', error);
    res.status(500).json({ error: 'Failed to calculate total outstanding' });
  }
};

export const getCreditsByCustomer = async (req, res) => {
  try {
    const { customer_name } = req.params;
    
    const { data: credits, error } = await supabase
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
      .eq('customer_name', customer_name)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add calculated total_paid for each credit
    const creditsWithPayments = await Promise.all(
      credits.map(async (credit) => {
        const { data: payments } = await supabase
          .from('credit_payments')
          .select('amount_paid, paid_at')
          .eq('credit_id', credit.id)
          .order('paid_at', { ascending: false });

        const totalPaid = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount_paid), 0) || 0;
        
        return {
          ...credit,
          amount_paid: totalPaid,
          remaining: parseFloat(credit.amount_owed) - totalPaid,
          payments: payments || []
        };
      })
    );

    res.json(creditsWithPayments);
  } catch (error) {
    console.error('Error fetching customer credits:', error);
    res.status(500).json({ error: 'Failed to fetch customer credits' });
  }
};

export const makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_paid } = req.body;

    if (!amount_paid || isNaN(amount_paid) || amount_paid <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    // Get the credit record
    const { data: credit, error: creditError } = await supabase
      .from('credits')
      .select('*')
      .eq('id', id)
      .single();

    if (creditError) throw creditError;
    if (!credit) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    // Get current total paid
    const { data: existingPayments } = await supabase
      .from('credit_payments')
      .select('amount_paid')
      .eq('credit_id', id);

    const currentTotalPaid = existingPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount_paid), 0) || 0;
    const remaining = parseFloat(credit.amount_owed) - currentTotalPaid;

    // Validate payment amount
    if (parseFloat(amount_paid) > remaining) {
      return res.status(400).json({ 
        error: `Payment amount cannot exceed remaining balance of ${remaining}` 
      });
    }

    // Insert payment record
    const { data: payment, error: paymentError } = await supabase
      .from('credit_payments')
      .insert([{
        credit_id: id,
        amount_paid: parseFloat(amount_paid)
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update credit status using the function
    const { error: updateError } = await supabase.rpc('update_credit_status_after_payment', {
      credit_id_param: id
    });

    if (updateError) throw updateError;

    // Get updated credit record
    const { data: updatedCredit, error: fetchError } = await supabase
      .from('credits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    res.json({
      message: 'Payment recorded successfully',
      payment,
      credit: updatedCredit
    });
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
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

    // Get payment history
    const { data: payments } = await supabase
      .from('credit_payments')
      .select('*')
      .eq('credit_id', id)
      .order('paid_at', { ascending: false });

    const totalPaid = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount_paid), 0) || 0;

    res.json({
      ...credit,
      amount_paid: totalPaid,
      remaining: parseFloat(credit.amount_owed) - totalPaid,
      payments: payments || []
    });
  } catch (error) {
    console.error('Error fetching credit:', error);
    res.status(500).json({ error: 'Failed to fetch credit' });
  }
};