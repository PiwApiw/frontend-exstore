import { create } from "zustand";

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  city?: string | null;
  address?: string | null;
  logo_url?: string | null;
  is_active: boolean;
}

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  weight: number;
  stock: number;
  available_stock: number;
  status: string;
  is_preorder: boolean;
  estimated_ready_date?: string | null;
  preorder_days?: number | null;
  primary_image?: {
    thumbnail?: string;
    original?: string;
  } | null;
}

export interface CartItem {
  id: string;
  userId: string;
  storeId: string;
  productId: string;
  quantity: number;
  itemSubtotal: number;
  product?: CartProduct;
  store?: StoreInfo;
}

export interface StoreGroup {
  store: StoreInfo;
  subtotal: number;
  totalWeight: number;
  totalItems: number;
  items: CartItem[];
}

export interface CartSummary {
  stores: StoreGroup[];
  totalStores: number;
  totalItems: number;
  totalUniqueItems: number;
  grandTotal: number;
}

interface CartStoreState {
  items: CartItem[];
  stores: StoreGroup[];
  totalStores: number;
  totalItems: number;
  totalUniqueItems: number;
  grandTotal: number;
  selectedStoreIds: string[]; // For selective store checkout
  
  // Actions
  setCartSummary: (summary: CartSummary) => void;
  setItems: (items: CartItem[]) => void;
  toggleStoreSelection: (storeId: string) => void;
  selectAllStores: () => void;
  clearSelection: () => void;
}

/**
 * Calculates per-store grouping and subtotals from a list of cart items.
 * Enforces Property 7: Exactly N groups for items from N stores, with union preserved.
 */
export function calculateStoreGroups(items: CartItem[]): StoreGroup[] {
  const groupMap = new Map<string, { store: StoreInfo; items: CartItem[]; subtotal: number; totalWeight: number; totalItems: number }>();

  for (const item of items) {
    const storeId = item.storeId;
    const storeInfo: StoreInfo = item.store ?? {
      id: storeId,
      name: "Toko UMKM",
      slug: "",
      status: "active",
      is_active: true,
    };

    const price = item.product?.price ?? Math.round(item.itemSubtotal / (item.quantity || 1));
    const weight = item.product?.weight ?? 0;
    const itemSubtotal = price * item.quantity;

    if (!groupMap.has(storeId)) {
      groupMap.set(storeId, {
        store: storeInfo,
        items: [],
        subtotal: 0,
        totalWeight: 0,
        totalItems: 0,
      });
    }

    const group = groupMap.get(storeId)!;
    group.items.push({
      ...item,
      itemSubtotal,
    });
    group.subtotal += itemSubtotal;
    group.totalWeight += weight * item.quantity;
    group.totalItems += item.quantity;
  }

  return Array.from(groupMap.values());
}

export const useCartStore = create<CartStoreState>((set) => ({
  items: [],
  stores: [],
  totalStores: 0,
  totalItems: 0,
  totalUniqueItems: 0,
  grandTotal: 0,
  selectedStoreIds: [],

  setCartSummary: (summary: CartSummary) =>
    set({
      stores: summary.stores,
      totalStores: summary.totalStores,
      totalItems: summary.totalItems,
      totalUniqueItems: summary.totalUniqueItems,
      grandTotal: summary.grandTotal,
      items: summary.stores.flatMap((s) => s.items),
    }),

  setItems: (items: CartItem[]) => {
    const stores = calculateStoreGroups(items);
    const grandTotal = stores.reduce((sum, g) => sum + g.subtotal, 0);
    const totalItems = stores.reduce((sum, g) => sum + g.totalItems, 0);

    set({
      items,
      stores,
      totalStores: stores.length,
      totalItems,
      totalUniqueItems: items.length,
      grandTotal,
    });
  },

  toggleStoreSelection: (storeId: string) =>
    set((state) => ({
      selectedStoreIds: state.selectedStoreIds.includes(storeId)
        ? state.selectedStoreIds.filter((id) => id !== storeId)
        : [...state.selectedStoreIds, storeId],
    })),

  selectAllStores: () =>
    set((state) => ({
      selectedStoreIds: state.stores.map((s) => s.store.id),
    })),

  clearSelection: () => set({ selectedStoreIds: [] }),
}));
