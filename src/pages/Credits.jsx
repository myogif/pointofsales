import React, { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { creditsAPI } from '../services/api';
import { formatPrice } from '../utils/priceFormatter';
import toast from 'react-hot-toast';

const PaymentModal = ({ credit, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingAmount = credit.amount_owed - (credit.amount_paid || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    if (paymentAmount > remainingAmount) {
      toast.error(`Payment cannot exceed the remaining amount of ${formatPrice(remainingAmount)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await creditsAPI.makePayment(credit.id, { amount: paymentAmount });
      toast.success('Payment recorded successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Make a Payment</h3>
        <div className="mb-4">
          <p>Customer: <span className="font-medium">{credit.customer_name}</span></p>
          <p>Amount Owed: <span className="font-medium">{formatPrice(credit.amount_owed)}</span></p>
          <p>Amount Paid: <span className="font-medium">{formatPrice(credit.amount_paid || 0)}</span></p>
          <p className="text-lg font-bold">Remaining: <span className="text-red-600">{formatPrice(remainingAmount)}</span></p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter amount"
                autoFocus
                step="0.01"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Credits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [credits, setCredits] = useState([]);
  const [totalAllCredits, setTotalAllCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] = useState(null);

  useEffect(() => {
    fetchCredits();
  }, [statusFilter]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await creditsAPI.getAll(params);
      setCredits(response.data.credits);
      setTotalAllCredits(response.data.totalAllCredits);
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast.error('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (credit) => {
    setSelectedCredit(credit);
  };

  const handlePaymentSuccess = () => {
    setSelectedCredit(null);
    fetchCredits();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partially_paid':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredCredits = Array.isArray(credits) ? credits.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Management</h1>
            <p className="text-gray-600">Track and manage customer credits</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <p className="text-blue-800 font-semibold">Total Outstanding Credits: {formatPrice(totalAllCredits)}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Credit Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Total Owed</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Total Paid</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Remaining</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Credit Count</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCredits.map(customer => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.customer_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">
                        {formatPrice(customer.total_owed)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">
                        {formatPrice(customer.total_paid)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-red-600">
                        {formatPrice(customer.total_owed - customer.total_paid)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500">
                        {customer.credits.length} credit(s)
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleOpenPaymentModal(customer.credits[0])}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Make Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {filteredCredits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CreditCard className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">No customer credits found</p>
          <p className="text-sm text-gray-500 mt-2">Customer credits will appear here when customers make credit purchases</p>
        </div>
      )}

      {selectedCredit && (
        <PaymentModal
          credit={selectedCredit}
          onClose={() => setSelectedCredit(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Credits;
