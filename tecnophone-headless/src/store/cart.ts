'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, WCProduct, WCProductVariation } from '@/types/woocommerce';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  lastUpdated: number;
  freeShippingCelebration: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: WCProduct, quantity?: number, variation?: WCProductVariation) => void;
  removeItem: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  dismissFreeShipping: () => void;
}

const FREE_SHIPPING_SEEN_KEY = 'tp-free-shipping-seen';

function shouldCelebrateFreeShipping(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(FREE_SHIPPING_SEEN_KEY) === '1') return false;
    sessionStorage.setItem(FREE_SHIPPING_SEEN_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

const CART_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastUpdated: Date.now(),
      freeShippingCelebration: false,

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      dismissFreeShipping: () => set({ freeShippingCelebration: false }),

      addItem: (product, quantity = 1, variation) => {
        const celebrate = shouldCelebrateFreeShipping();
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
            return {
              items: newItems,
              isOpen: !celebrate,
              lastUpdated: Date.now(),
              freeShippingCelebration: celebrate || state.freeShippingCelebration,
            };
          }

          return {
            items: [
              ...state.items,
              { product, quantity, variationId: variation?.id, variation },
            ],
            isOpen: !celebrate,
            lastUpdated: Date.now(),
            freeShippingCelebration: celebrate || state.freeShippingCelebration,
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
            ? parseFloat(item.variation.price) || 0
            : parseFloat(item.product.price) || 0;
          return sum + price * item.quantity;
        }, 0),
    }),
    {
      name: 'tecnophone-cart',
      partialize: (state) => ({
        items: state.items.map((item) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            type: item.product.type,
            price: item.product.price,
            regular_price: item.product.regular_price,
            sale_price: item.product.sale_price,
            on_sale: item.product.on_sale,
            stock_status: item.product.stock_status,
            images: item.product.images.slice(0, 1),
            external_url: item.product.external_url,
          } as WCProduct,
          quantity: item.quantity,
          variationId: item.variationId,
          variation: item.variation,
        })),
        lastUpdated: state.lastUpdated,
      }),
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
