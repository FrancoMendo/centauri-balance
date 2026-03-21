import { create } from "zustand";
import { Producto } from "../lib/schema";

/** Representa un item dentro del carrito temporal de ventas */
export interface CartItem {
  product: Producto;
  quantity: number;
  subtotal: number; // precio_venta * cantidad
}

interface SalesState {
  cart: CartItem[];
  searchQuery: string;

  // Acciones del carrito
  setSearchQuery: (query: string) => void;
  addToCart: (product: Producto) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, newPrice: number) => void;
  clearCart: () => void;

  // Getters calculados
  getTotal: () => number;
  getItemCount: () => number;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  cart: [],
  searchQuery: "",

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  addToCart: (product: Producto) => {
    const { cart } = get();
    const existingItem = cart.find(
      (item) => item.product.id_producto === product.id_producto
    );

    if (existingItem) {
      // Si ya existe, incrementar la cantidad en 1
      set({
        cart: cart.map((item) =>
          item.product.id_producto === product.id_producto
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.precio_venta,
              }
            : item
        ),
      });
    } else {
      // Si no existe, agregarlo con cantidad 1
      set({
        cart: [
          ...cart,
          {
            product,
            quantity: 1,
            subtotal: product.precio_venta,
          },
        ],
      });
    }
  },

  removeFromCart: (productId: number) => {
    set({
      cart: get().cart.filter(
        (item) => item.product.id_producto !== productId
      ),
    });
  },

  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      // Si la cantidad baja a 0 o menos, sacar el item
      get().removeFromCart(productId);
      return;
    }

    set({
      cart: get().cart.map((item) =>
        item.product.id_producto === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.product.precio_venta,
            }
          : item
      ),
    });
  },

  updatePrice: (productId: number, newPrice: number) => {
    if (newPrice < 0) return;
    set({
      cart: get().cart.map((item) =>
        item.product.id_producto === productId
          ? {
              ...item,
              product: { ...item.product, precio_venta: newPrice },
              subtotal: item.quantity * newPrice,
            }
          : item
      ),
    });
  },

  clearCart: () => {
    set({ cart: [], searchQuery: "" });
  },

  getTotal: () => {
    return get().cart.reduce((total, item) => total + item.subtotal, 0);
  },

  getItemCount: () => {
    return get().cart.reduce((count, item) => count + item.quantity, 0);
  },
}));
