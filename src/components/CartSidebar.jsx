import React, { useState, useEffect } from 'react';
import { Trash2, CreditCard, DollarSign, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { customersAPI } from '../services/api';
import { formatPrice } from '../utils/priceFormatter';
import toast from 'react-hot-toast';

const CartSidebar = () => {
  const { cart, removeFromCart, updateItem, clearCart, getCartTotal, processPayment, saveAsCredit } = useCart();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handlePayNow = async () => {
    await processPayment();
  };

  const handleSaveAsCredit = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    
    const success = await saveAsCredit(selectedCustomer);
    if (success) {
      setShowCreditModal(false);
      setSelectedCustomer(null);
      setCustomerSearch('');
    }
  };

  useEffect(() => {
    if (showCreditModal) {
      fetchCustomers();
    }
  }, [showCreditModal, currentPage, customerSearch]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customersAPI.getAll({ search: customerSearch, page: currentPage, limit: 5 });
      setCustomers(response.data.data || response.data);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
  };

  const handleQuantityChange = (item, newQuantity) => {
    const quantity = parseFloat(newQuantity);
    if (!isNaN(quantity) && quantity >= 0) {
      updateItem(item.id, item.selectedUnit, { quantity });
    }
  };

  const handlePriceChange = (item, newPrice) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      updateItem(item.id, item.selectedUnit, { price });
    }
  };

  return (
    <>
      <div className="w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Cart</h2>
          <p className="text-sm text-gray-600 mt-1">
            {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 9M7 13l-1.5-9M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
                </svg>
              </div>
              <p className="text-gray-600">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-2">Add items to get started</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.id}-${item.selectedUnit}-${index}`} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id, item.selectedUnit)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-xs text-gray-500">Qty ({item.selectedUnit})</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item, e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded-md"
                            step={item.selectedUnit === 'pcs' ? 1 : 0.1}
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Price</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handlePriceChange(item, e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded-md"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-800">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(getCartTotal())}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handlePayNow}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <DollarSign className="w-5 h-5" />
                <span>Pay Now</span>
              </button>
              
              <button
                onClick={() => setShowCreditModal(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
              >
                <CreditCard className="w-5 h-5" />
                <span>Save as Credit</span>
              </button>
            </div>
            
            <button
              onClick={clearCart}
              className="w-full mt-3 text-red-600 hover:text-red-800 transition-colors text-sm font-medium"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save as Credit</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter customer name to search"
                />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {loadingCustomers ? (
                  <div className="p-2 text-sm text-gray-500">Loading customers...</div>
                ) : customers.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No customers found</div>
                ) : (
                  customers.map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className={`w-full p-2 text-left text-sm border-b border-gray-200 hover:bg-gray-100 ${
                        selectedCustomer && selectedCustomer.id === customer.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </button>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsCredit}
                disabled={!selectedCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartSidebar;
