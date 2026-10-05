# ExStore — Frontend Web Application

[![Next.js](https://img.shields.io/badge/Next.js-15%2F16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-443E38?style=for-the-badge&logo=zustand&logoColor=white)](https://github.com/pmndrs/zustand)

Aplikasi web modern untuk platform **ExStore Multi-Tenant E-Commerce Marketplace**, dibangun menggunakan **Next.js App Router**, **React 19**, **TypeScript**, dan **Tailwind CSS v4** dengan integrasi PWA (*Progressive Web App*) dan real-time WebSocket.

---

## 📑 Daftar Isi

- [Arsitektur & Fitur Unggulan](#-arsitektur--fitur-unggulan)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
- [Variabel Lingkungan (.env.local)](#-variabel-lingkungan-envlocal)
- [Arsitektur State & Data Fetching](#-arsitektur-state--data-fetching)
- [Komunikasi Real-Time (WebSockets)](#-komunikasi-real-time-websockets)
- [Kompilasi & Deployment](#-kompilasi--deployment)
- [Struktur Direktori Frontend](#-struktur-direktori-frontend)

---

## 🌟 Arsitektur & Fitur Unggulan

1. **Next.js App Router & Server Components**
   - Performa loading optimal dengan pemisahan cerdas antara *React Server Components* (SSR/SSG untuk SEO dan data awal) dan *Client Components* (untuk interaktivitas interaktif).
   - Optimasi metadata dinamis untuk setiap halaman produk, toko, dan kategori.

2. **Pengalaman Belanja Multi-Store**
   - **Katalog & Filter Interaktif**: Pencarian produk berbasis kata kunci, kategori, rentang harga, lokasi toko, serta ketersediaan stok fisik atau *Pre-Order*.
   - **Varian Multi-SKU**: Pemilihan atribut produk dinamis (ukuran, warna, spesifikasi) dengan perubahan harga, stok, dan gambar secara instan.
   - **Multi-Store Cart**: Pengelompokan item keranjang belanja otomatis berdasarkan toko penjual dengan opsi *checklist* per toko.

3. **Multi-Step Checkout & Split-Order**
   - Alur checkout bertahap: Pemilihan alamat pengiriman, opsi kurir per toko, serta kalkulasi diskon voucher (voucher toko dan voucher platform).
   - Integrasi pembayaran instan dengan status tagihan *real-time*.

4. **Portal Pelanggan & Pelacakan Pesanan**
   - Riwayat transaksi terperinci dengan indikator status alur pesanan (`Menunggu Pembayaran`, `Diproses`, `Dikirim`, `Selesai`).
   - Fitur konfirmasi penerimaan barang dan pembatalan pesanan sebelum pengiriman.
   - Modal pengajuan pengembalian barang (*Return Request*) dalam masa garansi 7 hari disertai unggahan bukti foto/video.

5. **Seller Center & Dashboard Merchant**
   - **Manajemen Produk**: Tambah/edit produk dengan resolusi varian SKU dan kompresi gambar otomatis di sisi klien (*client-side image compression*) sebelum unggah.
   - **Pemrosesan Pesanan**: Pengaturan resi pengiriman dan respons persetujuan/penolakan retur.
   - **Keuangan & Saldo**: Pemantauan saldo tersedia, saldo escrow yang tertahan, piutang retur, serta form pengajuan penarikan dana (*withdrawal*). Akses dilindungi sistem RBAC agar staf toko tidak dapat melihat data finansial.

6. **Progressive Web App (PWA) & Mobile-First**
   - Dukungan instalasi aplikasi di perangkat mobile/desktop dengan caching offline aset statis via `@ducanh2912/next-pwa`.

---

## 📋 Prasyarat Sistem

Pastikan perangkat Anda telah terinstal:

- **Node.js**: Versi 20.x atau 22.x LTS
- **Package Manager**: `npm` (v10+), `pnpm`, atau `yarn`

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Masuk ke Direktori Frontend
```bash
cd frontend
```

### 2. Pasang Dependensi Node.js
```bash
npm install
```

### 3. Buat File Konfigurasi `.env.local`
Salin template konfigurasi:
```bash
# Windows PowerShell
copy .env.example .env.local

# Linux / macOS / Bash
cp .env.example .env.local
```

### 4. Jalankan Development Server
```bash
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000) untuk mengakses aplikasi.

---

## ⚙️ Variabel Lingkungan (.env.local)

Konfigurasikan endpoint backend dan kredensial Reverb:

```env
# URL Endpoint API Backend (Laravel)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Konfigurasi Real-Time WebSocket (Laravel Reverb)
NEXT_PUBLIC_REVERB_APP_KEY=exstore-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http

# Aplikasi PWA & Nama Platform
NEXT_PUBLIC_APP_NAME=ExStore
```

---

## 🔄 Arsitektur State & Data Fetching

Aplikasi memisahkan penanganan status (*state*) menjadi dua lapisan utama:

### 1. Server State (TanStack React Query v5)
Digunakan untuk data yang berasal dari API backend:
- Melakukan *caching*, deduplikasi request, *background re-fetching*, dan penanganan state *loading/error*.
- *Optimistic Updates* pada aksi keranjang belanja dan perubahan status pesanan untuk UX yang instan tanpa jeda.

### 2. Client State (Zustand v5)
Digunakan untuk data lokal di peramban:
- **`useCartStore`**: Mengelola item terpilih, kuantitas sementara, dan ringkasan checkout.
- **`useAuthStore`**: Menyimpan token autentikasi Sanctum dan sesi pengguna aktif.
- **`useUiStore`**: Mengatur modal dialog, notifikasi toast, dan preferensi tema.

---

## 📡 Komunikasi Real-Time (WebSockets)

Frontend menggunakan **Laravel Echo** bersama driver **Pusher-JS** yang terhubung langsung ke **Laravel Reverb**:

- **Notifikasi Pesanan**: Pembeli dan penjual menerima pembaruan instan ketika status pesanan berubah tanpa perlu merefresh halaman.
- **Support & Live Chat**: Pesan chat antar pengguna terkirim dan diterima secara *real-time* dengan isolasi tenant toko.

```typescript
// Contoh inisialisasi Echo di lib/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 80,
    wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 443,
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

---

## 🏗 Kompilasi & Deployment

### Periksa Linting & Tipe TypeScript
```bash
npm run lint
```

### Membuat Production Build
```bash
npm run build
```

### Menjalankan Production Server
```bash
npm run start
```

---

## 📂 Struktur Direktori Frontend

```text
frontend/
├── app/                  # Next.js 15+ App Router
│   ├── (auth)/           # Route Group: Login, Register, Verifikasi
│   ├── (buyer)/          # Route Group: Katalog, Produk, Keranjang, Checkout, Pesanan
│   ├── (seller)/         # Route Group: Dashboard Toko, Produk, Pesanan, Keuangan
│   ├── (admin)/          # Route Group: Dashboard Platform & Verifikasi KYC
│   ├── api/              # Route Handlers lokal (bila diperlukan)
│   ├── layout.tsx        # Root layout, font providers, query client provider
│   └── page.tsx          # Halaman beranda marketplace
├── components/           # Reusable UI Components
│   ├── common/           # Buttons, Inputs, Modals, Badges, Skeleton loaders
│   ├── layout/           # Navbar, Footer, Sidebar, Header
│   ├── product/          # ProductCard, VariantSelector, ImageGallery
│   ├── cart/             # CartItem, StoreCartGroup, CheckoutSummary
│   └── seller/           # FinancialSummary, OrderStatusBadge, ReturnActionModal
├── hooks/                # Custom React Hooks (useAuth, useCart, useOrders)
├── lib/                  # Konfigurasi utilitas (axios/fetch client, echo.ts, formatters)
├── public/               # File statis, favicon, ikon PWA, manifest.json
├── services/             # API client functions (authApi, orderApi, financeApi)
└── types/                # TypeScript interface & type definitions
```
