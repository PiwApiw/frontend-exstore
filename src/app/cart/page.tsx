import { CartView } from "@/components/cart/CartView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keranjang Belanja | Exstore Marketplace",
  description: "Kelola keranjang belanja produk UMKM lokal Anda di Exstore.",
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <CartView />
    </main>
  );
}
