"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CartSummary,
  CartItem,
  useCartStore,
} from "@/stores/cart-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper for authenticated API calls
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || "Terjadi kesalahan pada sistem.",
      errorCode: data.error_code,
      availableStock: data.available_stock,
      errors: data.errors,
    };
  }

  return data;
}

export function useCart() {
  const queryClient = useQueryClient();
  const setCartSummary = useCartStore((state) => state.setCartSummary);

  // Fetch user's cart with multi-store grouping
  const cartQuery = useQuery<CartSummary>({
    queryKey: ["cart"],
    queryFn: async () => {
      const result = await fetchWithAuth("/api/cart");
      const backendData = result.data;

      const summary: CartSummary = {
        stores: backendData.stores.map((s: any) => ({
          store: s.store,
          subtotal: s.subtotal,
          totalWeight: s.total_weight,
          totalItems: s.total_items,
          items: s.items.map((i: any) => ({
            id: i.id,
            userId: i.user_id,
            storeId: i.store_id,
            productId: i.product_id,
            quantity: i.quantity,
            itemSubtotal: i.item_subtotal,
            product: i.product,
            store: i.store,
          })),
        })),
        totalStores: backendData.total_stores,
        totalItems: backendData.total_items,
        totalUniqueItems: backendData.total_unique_items,
        grandTotal: backendData.grand_total,
      };

      return summary;
    },
  });

  // Sync to zustand whenever data updates
  useEffect(() => {
    if (cartQuery.data) {
      setCartSummary(cartQuery.data);
    }
  }, [cartQuery.data, setCartSummary]);

  // Add Item with Optimistic Update
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await fetchWithAuth("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<CartSummary>(["cart"]);

      // Optimistic update of local query cache
      if (previousCart) {
        let found = false;
        const newStores = previousCart.stores.map((storeGroup) => {
          const newItems = storeGroup.items.map((item) => {
            if (item.productId === productId) {
              found = true;
              const newQty = item.quantity + quantity;
              const unitPrice = item.product?.price ?? Math.round(item.itemSubtotal / item.quantity);
              return {
                ...item,
                quantity: newQty,
                itemSubtotal: unitPrice * newQty,
              };
            }
            return item;
          });

          if (found) {
            const newSubtotal = newItems.reduce((sum, it) => sum + it.itemSubtotal, 0);
            return {
              ...storeGroup,
              items: newItems,
              subtotal: newSubtotal,
              totalItems: newItems.reduce((sum, it) => sum + it.quantity, 0),
            };
          }
          return storeGroup;
        });

        if (found) {
          queryClient.setQueryData<CartSummary>(["cart"], {
            ...previousCart,
            stores: newStores,
            totalItems: previousCart.totalItems + quantity,
            grandTotal: newStores.reduce((sum, s) => sum + s.subtotal, 0),
          });
        }
      }

      return { previousCart };
    },
    onError: (err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // Update Item Quantity with Optimistic Update
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return await fetchWithAuth(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<CartSummary>(["cart"]);

      if (previousCart) {
        const newStores = previousCart.stores.map((storeGroup) => {
          const newItems = storeGroup.items.map((item) => {
            if (item.id === itemId) {
              const unitPrice = item.product?.price ?? Math.round(item.itemSubtotal / (item.quantity || 1));
              return {
                ...item,
                quantity,
                itemSubtotal: unitPrice * quantity,
              };
            }
            return item;
          });

          return {
            ...storeGroup,
            items: newItems,
            subtotal: newItems.reduce((sum, it) => sum + it.itemSubtotal, 0),
            totalItems: newItems.reduce((sum, it) => sum + it.quantity, 0),
          };
        });

        queryClient.setQueryData<CartSummary>(["cart"], {
          ...previousCart,
          stores: newStores,
          totalItems: newStores.reduce((sum, s) => sum + s.totalItems, 0),
          grandTotal: newStores.reduce((sum, s) => sum + s.subtotal, 0),
        });
      }

      return { previousCart };
    },
    onError: (err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // Remove Item with Optimistic Update
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await fetchWithAuth(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      });
    },
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<CartSummary>(["cart"]);

      if (previousCart) {
        const newStores = previousCart.stores
          .map((storeGroup) => {
            const newItems = storeGroup.items.filter((item) => item.id !== itemId);
            return {
              ...storeGroup,
              items: newItems,
              subtotal: newItems.reduce((sum, it) => sum + it.itemSubtotal, 0),
              totalItems: newItems.reduce((sum, it) => sum + it.quantity, 0),
            };
          })
          .filter((storeGroup) => storeGroup.items.length > 0);

        queryClient.setQueryData<CartSummary>(["cart"], {
          ...previousCart,
          stores: newStores,
          totalStores: newStores.length,
          totalUniqueItems: newStores.reduce((sum, s) => sum + s.items.length, 0),
          totalItems: newStores.reduce((sum, s) => sum + s.totalItems, 0),
          grandTotal: newStores.reduce((sum, s) => sum + s.subtotal, 0),
        });
      }

      return { previousCart };
    },
    onError: (err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  // Clear Cart
  const clearCartMutation = useMutation({
    mutationFn: async (storeId?: string) => {
      const url = storeId ? `/api/cart?store_id=${storeId}` : "/api/cart";
      return await fetchWithAuth(url, { method: "DELETE" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,
    refetch: cartQuery.refetch,
    addToCart: addToCartMutation.mutateAsync,
    isAdding: addToCartMutation.isPending,
    updateQuantity: updateQuantityMutation.mutateAsync,
    isUpdating: updateQuantityMutation.isPending,
    removeItem: removeItemMutation.mutateAsync,
    isRemoving: removeItemMutation.isPending,
    clearCart: clearCartMutation.mutateAsync,
    isClearing: clearCartMutation.isPending,
  };
}
