import React, { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import { formatPrice } from '../utils/priceFormatter';
import { List, DollarSign, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      const response = await salesAPI.getAll(params);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <List className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      default:
        return <List className="w-5 h-5 text-gray-600" />;
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">View all sales and credit transactions.</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Total</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Payment Method</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="py-4 px-6 font-semibold">{formatPrice(tx.total)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(tx.payment_method)}
                      <span>{tx.payment_method.charAt(0).toUpperCase() + tx.payment_method.slice(1)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tx.status)}
                      <span>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{tx.users?.username || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {transactions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No transactions found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Transactions;
