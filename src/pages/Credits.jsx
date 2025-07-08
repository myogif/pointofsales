import React, { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle, Clock, AlertCircle, DollarSign, Eye, ArrowLeft, Calendar, Receipt } from 'lucide-react';
import { creditsAPI } from '../services/api';
import { formatPrice } from '../utils/priceFormatter';
import toast from 'react-hot-toast';

const PaymentModal = ({ credit, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingAmount = credit.remaining || (credit.amount_owed - (credit.amount_paid || 0));
  const paymentAmount = parseFloat(amount) || 0;
  const newRemainingAmount = Math.max(0, remainingAmount - paymentAmount);
  const isValidPayment = paymentAmount > 0 && paymentAmount <= remainingAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPayment) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await creditsAPI.makePayment(credit.id, { amount_paid: paymentAmount });
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
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Record Payment</h3>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-900">{credit.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Owed:</span>
              <span className="font-medium text-gray-900">{formatPrice(credit.amount_owed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-medium text-green-600">{formatPrice(credit.amount_paid || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-900 font-medium">Remaining:</span>
              <span className="font-bold text-red-600">{formatPrice(remainingAmount)}</span>
            </div>
            {paymentAmount > 0 && (
              <>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Payment Amount:</span>
                  <span className={`font-medium ${isValidPayment ? 'text-blue-600' : 'text-red-600'}`}>
                    -{formatPrice(paymentAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">New Remaining:</span>
                  <span className={`font-bold ${newRemainingAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(newRemainingAmount)}
                  </span>
                </div>
                {newRemainingAmount === 0 && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Credit will be fully paid
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  amount && !isValidPayment 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-green-500'
                }`}
                placeholder="Enter amount"
                autoFocus
                step="0.01"
                max={remainingAmount}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Maximum: {formatPrice(remainingAmount)}</p>
              {amount && !isValidPayment && (
                <p className="text-xs text-red-600">Invalid amount</p>
              )}
            </div>
            {/* Quick payment buttons */}
            <div className="flex space-x-2 mt-3">
              <button
                type="button"
                onClick={() => setAmount((remainingAmount / 4).toString())}
                className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setAmount((remainingAmount / 2).toString())}
                className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmount(remainingAmount.toString())}
                className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Full
              </button>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidPayment}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isSubmitting ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerDetailModal = ({ customerName, onClose, onPaymentSuccess }) => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] = useState(null);

  useEffect(() => {
    fetchCustomerCredits();
  }, [customerName]);

  const fetchCustomerCredits = async () => {
    try {
      setLoading(true);
      const response = await creditsAPI.getByCustomer(customerName);
      setCredits(response.data);
    } catch (error) {
      console.error('Error fetching customer credits:', error);
      toast.error('Failed to fetch customer credits');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedCredit(null);
    fetchCustomerCredits();
    onPaymentSuccess();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partially_paid':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
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

  const totals = credits.reduce((acc, credit) => ({
    totalOwed: acc.totalOwed + parseFloat(credit.amount_owed),
    totalPaid: acc.totalPaid + parseFloat(credit.amount_paid || 0),
    unpaidBalance: acc.unpaidBalance + parseFloat(credit.remaining || 0)
  }), { totalOwed: 0, totalPaid: 0, unpaidBalance: 0 });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Credit Details</h2>
              <p className="text-gray-600">{customerName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Owed</p>
                  <p className="text-xl font-bold text-blue-900">{formatPrice(totals.totalOwed)}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Paid</p>
                  <p className="text-xl font-bold text-green-900">{formatPrice(totals.totalPaid)}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-600 font-medium">Unpaid Balance</p>
                  <p className="text-xl font-bold text-red-900">{formatPrice(totals.unpaidBalance)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Credits Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount Owed</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Paid</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Remaining</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : credits.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No credit records found
                      </td>
                    </tr>
                  ) : (
                    credits.map(credit => (
                      <tr key={credit.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900">
                            {new Date(credit.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">
                            {formatPrice(credit.amount_owed)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(credit.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                              {credit.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {new Date(credit.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600">
                            {formatPrice(credit.amount_paid || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-red-600">
                            {formatPrice(credit.remaining || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {credit.remaining > 0 && (
                            <button
                              onClick={() => setSelectedCredit(credit)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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

const Credits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersResponse, totalResponse] = await Promise.all([
        creditsAPI.getAll(),
        creditsAPI.getTotalOutstanding()
      ]);
      
      setCustomers(customersResponse.data);
      setTotalOutstanding(totalResponse.data.total_outstanding);
    } catch (error) {
      console.error('Error fetching credits data:', error);
      toast.error('Failed to fetch credits data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchData();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Management</h1>
            <p className="text-gray-600">Track and manage customer credit accounts</p>
          </div>
          
          {/* Total Outstanding Badge */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">Total Outstanding Credits</p>
                <p className="text-2xl font-bold">{formatPrice(totalOutstanding)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customer Credits Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Customer Credit Summary</h2>
        </div>
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <CreditCard className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-gray-600 mb-2">
                      {searchTerm ? 'No customers found matching your search' : 'No outstanding credits found'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms' : 'All customer credits have been paid'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.customer_name} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.customer_name}</p>
                          <p className="text-sm text-gray-500">{customer.credit_count} credit record{customer.credit_count !== 1 ? 's' : ''}</p>
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
                        {formatPrice(customer.remaining)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.credit_count}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedCustomer(customer.customer_name)}
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customerName={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Credits;