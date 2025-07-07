import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && item.selectedUnit === action.payload.selectedUnit
      );
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && item.selectedUnit === action.payload.selectedUnit
              ? { ...item, quantity: item.quantity + action.payload.quantity, total: (item.quantity + action.payload.quantity) * item.price }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && item.selectedUnit === action.payload.selectedUnit)
        )
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && item.selectedUnit === action.payload.selectedUnit
            ? { ...item, quantity: action.payload.quantity, total: action.payload.quantity * item.price }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload
      };
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const savedCart = localStorage.getItem('vegetable-pos-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vegetable-pos-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (product, quantity, selectedUnit) => {
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const unitPrice = product[`price_${selectedUnit}`];
    const cartItem = {
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity: quantity,
      selectedUnit: selectedUnit,
      total: unitPrice * quantity,
      image_url: product.image_url
    };

    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (id, selectedUnit) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id, selectedUnit } });
    toast.success('Item removed from cart');
  };

  const updateQuantity = (id, selectedUnit, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, selectedUnit);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, selectedUnit, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const processPayment = async () => {
    if (state.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      await salesAPI.create({ items: state.items });
      toast.success('Payment processed successfully!');
      clearCart();
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Payment failed';
      toast.error(message);
      return false;
    }
  };

  const saveAsCredit = async (customerName) => {
    if (state.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName) {
      toast.error('Customer name is required for credit');
      return;
    }

    try {
      await salesAPI.createCredit({ 
        items: state.items, 
        customer_name: customerName 
      });
      toast.success('Order saved as credit!');
      clearCart();
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save credit';
      toast.error(message);
      return false;
    }
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + item.total, 0);
  };

  const getCartItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart: state.items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      processPayment,
      saveAsCredit,
      getCartTotal,
      getCartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};