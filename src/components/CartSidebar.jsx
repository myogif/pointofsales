import React, { useState } from 'react';
import { Trash2, Plus, Minus, CreditCard, DollarSign } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/priceFormatter';

const CartSidebar = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, processPayment, saveAsCredit } = useCart();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const handlePayNow = async () => {
    await processPayment();
  };

  const handleSaveAsCredit = async () => {
    if (!customerName.trim()) {
      return;
    }
    
    const success = await saveAsCredit(customerName);
    if (success) {
      setShowCreditModal(false);
      setCustomerName('');
    }
  };

  // Helper function to get the right increment based on unit type
  const getQuantityIncrement = (unit) => {
    switch(unit) {
      case 'pcs':
        return 1; // Whole numbers for pieces
      case 'kg':
      case 'ons':
      case 'liter':
        return 0.1; // Decimals for weight/volume
      default:
        return 0.1;
    }
  };

  // Helper function to format quantity display
  const formatQuantity = (quantity, unit) => {
    if (unit === 'pcs') {
      return Math.floor(quantity); // Show whole numbers for pieces
    }
    return quantity.toFixed(1); // Show decimals for weight/volume
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
              {cart.map((item, index) => {
                const increment = getQuantityIncrement(item.selectedUnit);
                const minQuantity = item.selectedUnit === 'pcs' ? 1 : 0.1;
                
                return (
                  <div key={`${item.id}-${item.selectedUnit}-${index}`} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={item.image_url || 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.price)} per {item.selectedUnit}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedUnit, Math.max(minQuantity, item.quantity - increment))}
                              className="w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-300"
                              disabled={item.quantity <= minQuantity}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-12 text-center">
                              {formatQuantity(item.quantity, item.selectedUnit)}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedUnit, item.quantity + increment)}
                              className="w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.selectedUnit)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Subtotal ({formatQuantity(item.quantity, item.selectedUnit)} {item.selectedUnit}):
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatPrice(item.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter customer name"
              />
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
                disabled={!customerName.trim()}
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