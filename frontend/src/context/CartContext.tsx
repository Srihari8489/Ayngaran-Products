import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { Cart } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: number, variantId?: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await api.get('/cart');
      setCart(res);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (productId: number, variantId?: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }

    const res: any = await api.post('/cart/items', { productId, variantId, quantity });
    setCart(res);
    openCart();
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    const res: any = await api.patch(`/cart/items/${cartItemId}`, { quantity });
    setCart(res);
  };

  const removeItem = async (cartItemId: number) => {
    const res: any = await api.delete(`/cart/items/${cartItemId}`);
    setCart(res);
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
