import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import api from '../api/client';

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isLoading: boolean;
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  addToWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Fetch wishlist from backend whenever user logs in or user changes
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setWishlist([]);
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await api.get('/wishlist');
      const items = Array.isArray(res) ? res : res?.data || [];
      const products = items.map((item: any) => item.product || item);
      setWishlist(products);
    } catch (err) {
      console.error('Failed to load wishlist from server', err);
      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated, refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: number) => {
      if (!isAuthenticated) return false;
      return wishlist.some((p) => p.id === productId);
    },
    [isAuthenticated, wishlist]
  );

  // Protected: Requires customer authentication to add
  const addToWishlist = useCallback(
    async (product: Product): Promise<boolean> => {
      if (!isAuthenticated) {
        openLoginModal();
        return false;
      }

      if (isInWishlist(product.id)) return true;

      // Optimistic update
      setWishlist((prev) => [product, ...prev]);

      try {
        await api.post(`/wishlist/${product.id}`, {});
        return true;
      } catch (err) {
        console.error('Failed to add to wishlist on backend', err);
        // Rollback on error
        setWishlist((prev) => prev.filter((p) => p.id !== product.id));
        return false;
      }
    },
    [isAuthenticated, openLoginModal, isInWishlist]
  );

  // Protected: Requires customer authentication to remove
  const removeFromWishlist = useCallback(
    async (productId: number): Promise<boolean> => {
      if (!isAuthenticated) {
        openLoginModal();
        return false;
      }

      const previous = wishlist;
      setWishlist((prev) => prev.filter((p) => p.id !== productId));

      try {
        await api.delete(`/wishlist/${productId}`);
        return true;
      } catch (err) {
        console.error('Failed to remove from wishlist on backend', err);
        setWishlist(previous);
        return false;
      }
    },
    [isAuthenticated, openLoginModal, wishlist]
  );

  // Protected toggle
  const toggleWishlist = useCallback(
    async (product: Product): Promise<boolean> => {
      if (!isAuthenticated) {
        openLoginModal();
        return false;
      }

      if (isInWishlist(product.id)) {
        return removeFromWishlist(product.id);
      } else {
        return addToWishlist(product);
      }
    },
    [isAuthenticated, openLoginModal, isInWishlist, removeFromWishlist, addToWishlist]
  );

  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setWishlist([]);

    try {
      await api.delete('/wishlist');
    } catch (err) {
      console.error('Failed to clear wishlist on backend', err);
      refreshWishlist();
    }
  }, [isAuthenticated, openLoginModal, refreshWishlist]);

  const openWishlist = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    setIsWishlistOpen(true);
  };

  const closeWishlist = () => setIsWishlistOpen(false);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: isAuthenticated ? wishlist.length : 0,
        isLoading,
        isWishlistOpen,
        openWishlist,
        closeWishlist,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
