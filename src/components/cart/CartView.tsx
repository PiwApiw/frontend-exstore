"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { StoreGroup, CartItem } from "@/stores/cart-store";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CartView() {
  const {
    cart,
    isLoading,
    isError,
    updateQuantity,
    removeItem,
    clearCart,
    isUpdating,
    isRemoving,
  } = useCart();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    setErrorMessage(null);

    try {
      await updateQuantity({ itemId: item.id, quantity: newQty });
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengubah kuantitas barang.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setErrorMessage(null);
    try {
      await removeItem(itemId);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghapus item dari keranjang.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-rose-900 dark:text-rose-200 mb-2">Gagal Memuat Keranjang</h2>
          <p className="text-sm text-rose-700 dark:text-rose-400 mb-6">
            Terjadi kendala saat mengambil data keranjang belanja Anda. Pastikan Anda telah login.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const stores = cart?.stores || [];
  const hasItems = stores.length > 0 && (cart?.totalItems ?? 0) > 0;

  if (!hasItems) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
          Keranjang Belanja Kosong
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto text-sm">
          Temukan produk unggulan dari berbagai UMKM lokal dan tambahkan ke keranjang Anda sekarang.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Keranjang Belanja
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {cart?.totalStores} Toko UMKM • {cart?.totalItems} Total Barang
          </p>
        </div>

        <button
          onClick={() => clearCart()}
          className="text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline self-start sm:self-auto"
        >
          Kosongkan Keranjang
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-amber-900 dark:text-amber-200">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-amber-500 hover:text-amber-700 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Stores Items + Sticky Checkout Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Store Groups (Requirement 4.1, 4.3) */}
        <div className="lg:col-span-8 space-y-6">
          {stores.map((group: StoreGroup) => (
            <div
              key={group.store.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
            >
              {/* Store Header */}
              <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {group.store.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {group.store.name}
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Terverifikasi
                      </span>
                    </h3>
                    {group.store.city && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Dikirim dari: {group.store.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Subtotal Toko:</span>
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(group.subtotal)}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.items.map((item: CartItem) => {
                  const product = item.product;
                  const isPreorder = product?.is_preorder;
                  const availableStock = product?.available_stock ?? 0;

                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Product Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                          {product?.primary_image?.thumbnail ? (
                            <img
                              src={product.primary_image.thumbnail}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-zinc-400">No Image</span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                            {product?.name ?? "Produk UMKM"}
                          </h4>
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-200 mt-1">
                            {formatRupiah(product?.price ?? 0)}
                          </p>

                          {/* Pre-order or Stock Badge */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {isPreorder ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                Pre-Order ({product?.preorder_days ?? 14} hari)
                              </span>
                            ) : (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Sisa stok: <strong className="text-zinc-700 dark:text-zinc-300">{availableStock}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-zinc-800">
                        {/* Stepper */}
                        <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={(!isPreorder && item.quantity >= availableStock) || isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-xs text-zinc-400 hidden sm:block">Subtotal:</span>
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {formatRupiah(item.itemSubtotal)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isRemoving}
                          title="Hapus dari keranjang"
                          className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Sticky Grand Total Summary Bar (Requirement 4.3) */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              Ringkasan Belanja
            </h2>

            <div className="space-y-3 py-4 text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Total Toko</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{cart?.totalStores} Toko</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Total Barang</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{cart?.totalItems} pcs</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Jenis Produk</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{cart?.totalUniqueItems} jenis</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Harga</span>
                <span className="text-xl font-extrabold text-zinc-950 dark:text-white">
                  {formatRupiah(cart?.grandTotal ?? 0)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Belum termasuk ongkos kirim per toko yang dihitung saat checkout.</p>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              Lanjut ke Checkout ({cart?.totalItems})
            </Link>

            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium">
                ← Lanjut Belanja
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
