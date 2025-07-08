import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { formatPrice } from '../utils/priceFormatter';

const ProductCard = ({ product }) => {
  const { items, addToCart, updateQuantity } = useCartStore();
  const [selectedUnit, setSelectedUnit] = useState(product.price_pcs ? 'pcs' : 'kg');
  const [quantity, setQuantity] = useState(1);

  const cartItem = items.find(item => item.id === product.id && item.selectedUnit === selectedUnit);

  const handleAddToCart = () => {
    const price = product[`price_${selectedUnit}`];
    addToCart({ ...product, price, selectedUnit }, quantity);
  };

  const getPrice = () => {
    return product[`price_${selectedUnit}`] || 0;
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100">
      <div className="relative">
        <img
          src={product.image_url || 'https://via.placeholder.com/150'}
          alt={product.name}
          className="w-full h-32 object-cover"
        />
        <span className="absolute top-2 right-2 bg-white text-gray-800 text-xs font-semibold px-2 py-1 rounded-full shadow">
          Stock: {product.stock_quantity}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-md mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{product.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <p className="text-green-600 font-bold text-xl">
            {formatPrice(getPrice())}
          </p>
          <p className="text-xs text-gray-400">#{product.barcode}</p>
        </div>

        <div className="flex space-x-2 mb-3">
          {product.price_kg && (
            <button onClick={() => setSelectedUnit('kg')} className={`px-3 py-1 text-sm font-semibold rounded-full ${selectedUnit === 'kg' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Kg</button>
          )}
          {product.price_ons && (
            <button onClick={() => setSelectedUnit('ons')} className={`px-3 py-1 text-sm font-semibold rounded-full ${selectedUnit === 'ons' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Ons</button>
          )}
           {product.price_pcs && (
            <button onClick={() => setSelectedUnit('pcs')} className={`px-3 py-1 text-sm font-semibold rounded-full ${selectedUnit === 'pcs' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Pcs</button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border border-gray-200 rounded-full">
            <button
              onClick={() => setQuantity(Math.max(selectedUnit === 'pcs' ? 1 : 0.1, quantity - (selectedUnit === 'pcs' ? 1 : 0.1)))}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-l-full"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-16 text-center font-bold text-sm border-none focus:ring-0"
              step={selectedUnit === 'pcs' ? 1 : 0.1}
            />
            <button
              onClick={() => setQuantity(quantity + (selectedUnit === 'pcs' ? 1 : 0.1))}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-r-full"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-gray-500">{selectedUnit}</span>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-green-500 text-white font-semibold py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
