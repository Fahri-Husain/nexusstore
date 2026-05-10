import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((game) => {
    setCartItems(prev => {
      if (prev.find(item => item.game_id === game.game_id)) {
        return prev;
      }
      return [...prev, game];
    });
  }, []);

  const removeFromCart = useCallback((gameId) => {
    setCartItems(prev => prev.filter(item => item.game_id !== gameId));
  }, []);

  const isInCart = useCallback((gameId) => {
    return cartItems.some(item => item.game_id === gameId);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const discountedPrice = Math.round(item.price - (item.price * (item.discount || 0) / 100));
      return total + discountedPrice;
    }, 0);
  }, [cartItems]);

  const cartCount = cartItems.length;

  const value = {
    cartItems, cartCount, addToCart, removeFromCart, isInCart, clearCart, getTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
