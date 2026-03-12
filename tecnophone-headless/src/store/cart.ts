'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, WCProduct, WCProductVariation } from '@/types/woocommerce';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  lastUpdated: number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: WCProduct, quantity?: number, variation?: WCProductVariation) => void;
  removeItem: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const CART_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastUpdated: Date.now(),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, quantity = 1, variation) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.variationId === (variation?.id ?? undefined)
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems, isOpen: true, lastUpdated: Date.now() };
          }

          return {
            items: [
              ...state.items,
              { product, quantity, variationId: variation?.id, variation },
            ],
            isOpen: true,
            lastUpdated: Date.now(),
          };
        });
      },

      removeItem: (productId, variationId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId && item.variationId === variationId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variationId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variationId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.variationId === variationId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => {
          const price = item.variation
            ? parseFloat(item.variation.price)
            : parseFloat(item.product.price);
          return sum + price * item.quantity;
        }, 0),
    }),
    {
      name: 'tecnophone-cart',
      partialize: (state) => ({ items: state.items, lastUpdated: state.lastUpdated }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state && state.lastUpdated && Date.now() - state.lastUpdated > CART_EXPIRY_MS) {
          state.items = [];
          state.lastUpdated = Date.now();
        }
      },
    }
  )
);
