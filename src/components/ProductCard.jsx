import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const getAvailableUnits = () => {
    const units = [];
    if (product.price_kg && product.price_kg > 0) {
      units.push({ value: 'kg', label: 'Kg', price: product.price_kg });
    }
    if (product.price_ons && product.price_ons > 0) {
      units.push({ value: 'ons', label: 'Ons', price: product.price_ons });
    }
    if (product.price_pcs && product.price_pcs > 0) {
      units.push({ value: 'pcs', label: 'Pcs', price: product.price_pcs });
    }
    if (product.price_liter && product.price_liter > 0) {
      units.push({ value: 'liter', label: 'Liter', price: product.price_liter });
    }
    return units;
  };

  const availableUnits = getAvailableUnits();
  
  // Set initial selectedUnit based on the first available unit or fallback to unit_type
  const [selectedUnit, setSelectedUnit] = useState(() => {
    if (availableUnits.length > 0) {
      return availableUnits[0].value;
    }
    return product.unit_type || 'pcs';
  });

  const currentPrice = product[`price_${selectedUnit}`] || availableUnits[0]?.price || 0;

  // Get quantity increment based on unit type
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

  // Format quantity display
  const formatQuantity = (quantity, unit) => {
    if (unit === 'pcs') {
      return Math.floor(quantity); // Show whole numbers for pieces
    }
    return quantity.toFixed(1); // Show decimals for weight/volume
  };

  const increment = getQuantityIncrement(selectedUnit);
  const minQuantity = selectedUnit === 'pcs' ? 1 : 0.1;

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(minQuantity, quantity + change);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedUnit);
    setQuantity(selectedUnit === 'pcs' ? 1 : 0.1);
  };

  // Handle unit change and reset quantity appropriately
  const handleUnitChange = (newUnit) => {
    setSelectedUnit(newUnit);
    setQuantity(newUnit === 'pcs' ? 1 : 0.1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden">
      <div className="relative">
        <img 
          src={product.image_url || 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400'} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
          Stock: {product.stock}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-green-600">
            {formatPrice(currentPrice)}
          </div>
          <div className="text-xs text-gray-500">
            #{product.barcode}
          </div>
        </div>

        {availableUnits.length > 1 && (
          <div className="mb-3">
            <div className="flex space-x-1">
              {availableUnits.map((unit) => (
                <button
                  key={unit.value}
                  onClick={() => handleUnitChange(unit.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedUnit === unit.value
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(-increment)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              disabled={quantity <= minQuantity}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={formatQuantity(quantity, selectedUnit)}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || minQuantity;
                setQuantity(Math.max(minQuantity, value));
              }}
              className="w-16 text-center border border-gray-300 rounded-md py-1 text-sm"
              step={increment}
              min={minQuantity}
            />
            <button
              onClick={() => handleQuantityChange(increment)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-gray-600">
            {selectedUnit === 'pcs' ? 'pieces' : selectedUnit}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;