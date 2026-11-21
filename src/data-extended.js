// Extended data: promo codes, tracking, social proof
export const promoCodes = [
  { code: "HEMAT20", discount: 20, type: "percent", minPurchase: 1000000, maxDiscount: 500000, expires: "2026-12-31" },
  { code: "LAPTOP50", discount: 50000, type: "fixed", minPurchase: 3000000, maxDiscount: 50000, expires: "2026-11-30" },
  { code: "NEWUSER", discount: 15, type: "percent", minPurchase: 500000, maxDiscount: 200000, expires: "2026-12-15" },
];

export const orderHistory = [
  {
    id: "ORD-20261115-001",
    date: "2026-11-15",
    items: [{ productId: "RSN-001", qty: 1, price: 5999000 }],
    total: 5999000,
    status: "delivered",
    tracking: [
      { date: "2026-11-15 10:30", status: "Pesanan diterima", location: "Jakarta" },
      { date: "2026-11-15 14:20", status: "Dikemas", location: "Jakarta" },
      { date: "2026-11-16 08:00", status: "Dikirim", location: "Jakarta" },
      { date: "2026-11-17 15:45", status: "Tiba di kota tujuan", location: "Bandung" },
      { date: "2026-11-18 09:30", status: "Diterima", location: "Bandung" },
    ],
  },
  {
    id: "ORD-20261020-045",
    date: "2026-10-20",
    items: [{ productId: "RSN-004", qty: 2, price: 450000 }],
    total: 900000,
    status: "delivered",
    tracking: [
      { date: "2026-10-20 11:00", status: "Pesanan diterima", location: "Jakarta" },
      { date: "2026-10-20 16:30", status: "Dikirim", location: "Jakarta" },
      { date: "2026-10-21 10:15", status: "Diterima", location: "Jakarta" },
    ],
  },
];

export const socialProof = {
  "RSN-001": { views: 1247, soldThisWeek: 8, liveViewers: 3 },
  "RSN-002": { views: 894, soldThisWeek: 5, liveViewers: 1 },
  "RSN-003": { views: 2341, soldThisWeek: 12, liveViewers: 7 },
  "RSN-004": { views: 3452, soldThisWeek: 23, liveViewers: 5 },
  "RSN-005": { views: 1523, soldThisWeek: 0, liveViewers: 2 },
  "RSN-006": { views: 987, soldThisWeek: 6, liveViewers: 1 },
};

export const flashSales = [
  { productId: "RSN-001", flashPrice: 5499000, originalPrice: 6999000, endsAt: "2026-11-21T18:00:00Z", stock: 5 },
  { productId: "RSN-004", flashPrice: 399000, originalPrice: 450000, endsAt: "2026-11-21T15:00:00Z", stock: 10 },
];

export const bundleDeals = [
  { id: "BUNDLE-01", name: "Paket Laptop + Mouse", productIds: ["RSN-001", "RSN-005"], bundlePrice: 6099000, normalPrice: 6149000, savings: 50000 },
  { id: "BUNDLE-02", name: "Paket Gaming", productIds: ["RSN-003", "RSN-004"], bundlePrice: 1650000, normalPrice: 1700000, savings: 50000 },
];

export const sellers = {
  "RSN-001": { name: "Toko Laptop Jakarta", rating: 4.8, joinedYear: 2020, totalSales: 1240, responseTime: "< 1 jam" },
  "RSN-002": { name: "Toko Laptop Jakarta", rating: 4.8, joinedYear: 2020, totalSales: 1240, responseTime: "< 1 jam" },
  "RSN-003": { name: "Monitor Official Store", rating: 4.9, joinedYear: 2019, totalSales: 3450, responseTime: "< 30 menit" },
  "RSN-004": { name: "Gaming Gear ID", rating: 4.7, joinedYear: 2021, totalSales: 890, responseTime: "< 2 jam" },
  "RSN-005": { name: "Logitech Official", rating: 4.9, joinedYear: 2018, totalSales: 5620, responseTime: "< 15 menit" },
  "RSN-006": { name: "SSD Specialist", rating: 4.6, joinedYear: 2022, totalSales: 540, responseTime: "< 3 jam" },
};

export const priceHistory = {
  "RSN-001": [
    { date: "2026-09-01", price: 6999000 },
    { date: "2026-09-15", price: 6799000 },
    { date: "2026-10-01", price: 6499000 },
    { date: "2026-10-15", price: 5999000 },
    { date: "2026-11-01", price: 5999000 },
  ],
  "RSN-003": [
    { date: "2026-09-01", price: 1499000 },
    { date: "2026-10-01", price: 1350000 },
    { date: "2026-11-01", price: 1250000 },
  ],
};

export const deliveryZones = [
  { city: "Jakarta", cost: 15000, days: "1-2" },
  { city: "Bandung", cost: 20000, days: "2-3" },
  { city: "Surabaya", cost: 25000, days: "3-4" },
  { city: "Yogyakarta", cost: 22000, days: "2-3" },
  { city: "Medan", cost: 35000, days: "4-5" },
  { city: "Semarang", cost: 23000, days: "3-4" },
];

export const stockAlerts = [];

export const userAddresses = [
  { id: 1, label: "Rumah", name: "Budi Santoso", phone: "081234567890", address: "Jl. Merdeka No. 123, Jakarta Pusat", city: "Jakarta", isDefault: true },
  { id: 2, label: "Kantor", name: "Budi Santoso", phone: "081234567890", address: "Gedung Menara Permata Lt. 5, Jakarta Selatan", city: "Jakarta", isDefault: false },
];

// ---------------------------------------------------------------------------
// Installment plans, shipping, badges, recently viewed
// ---------------------------------------------------------------------------
export const installmentPlans = [
  { months: 3, monthlyRate: 0.02, minAmount: 500000 },
  { months: 6, monthlyRate: 0.025, minAmount: 1000000 },
  { months: 12, monthlyRate: 0.03, minAmount: 2000000 },
];

export const shippingCosts = {
  Jakarta: { economy: 10000, regular: 25000, express: 50000, sameDay: 100000 },
  Bandung: { economy: 15000, regular: 35000, express: 70000, sameDay: 0 },
  Surabaya: { economy: 25000, regular: 50000, express: 90000, sameDay: 0 },
  Default: { economy: 50000, regular: 75000, express: 150000, sameDay: 0 },
};

export const badges = {
  "RSN-001": ["Trending", "Best Seller"],
  "RSN-002": ["New"],
  "RSN-003": ["Sale"],
  "RSN-004": ["Best Seller"],
};

export const productQa = {
  "RSN-001": [
    { q: "Baterai tahan berapa jam?", a: "Sekitar 8-10 jam pemakaian normal.", askedBy: "Rina", answeredAt: "2 hari lalu" },
    { q: "Sudah termasuk tas?", a: "Belum, tas dijual terpisah.", askedBy: "Dodi", answeredAt: "5 hari lalu" },
    { q: "Garansi resmi berapa tahun?", a: "Garansi resmi 1 tahun untuk unit dan sparepart.", askedBy: "Sari", answeredAt: "1 minggu lalu" },
  ],
  "RSN-003": [
    { q: "Ada port HDMI?", a: "Ada 2 port HDMI 2.0 dan 1 DisplayPort.", askedBy: "Agus", answeredAt: "3 hari lalu" },
    { q: "Support 144Hz?", a: "Ya, 144Hz via DisplayPort.", askedBy: "Bayu", answeredAt: "6 hari lalu" },
  ],
  "RSN-005": [
    { q: "Bisa untuk Mac?", a: "Bisa, plug and play tanpa driver.", askedBy: "Nina", answeredAt: "1 hari lalu" },
  ],
};

export const loyaltyProgram = {
  pointsPerRupiah: 0.01,
  tiers: [
    { name: "Silver", minPoints: 0, discount: 0.01 },
    { name: "Gold", minPoints: 5000, discount: 0.03 },
    { name: "Platinum", minPoints: 15000, discount: 0.05 },
  ],
};

export const userLoyalty = {
  points: 2400,
  tier: "Silver",
  nextTierPoints: 5000,
};

export const paymentMethods = [
  { id: "qris", name: "QRIS", type: "qr", fee: 0, logo: "📱" },
  { id: "bca", name: "BCA Virtual Account", type: "bank", fee: 0, logo: "🏦" },
  { id: "mandiri", name: "Mandiri Virtual Account", type: "bank", fee: 0, logo: "🏦" },
  { id: "bni", name: "BNI Virtual Account", type: "bank", fee: 0, logo: "🏦" },
  { id: "gopay", name: "GoPay", type: "ewallet", fee: 0, logo: "💳" },
  { id: "ovo", name: "OVO", type: "ewallet", fee: 0, logo: "💳" },
  { id: "dana", name: "DANA", type: "ewallet", fee: 0, logo: "💳" },
  { id: "shopee", name: "ShopeePay", type: "ewallet", fee: 0, logo: "💳" },
  { id: "indomaret", name: "Indomaret", type: "retail", fee: 2500, logo: "🏪" },
  { id: "alfamart", name: "Alfamart", type: "retail", fee: 2500, logo: "🏪" },
  { id: "cc", name: "Kartu Kredit/Debit", type: "card", fee: 0, logo: "💳" },
  { id: "cod", name: "Bayar di Tempat (COD)", type: "cod", fee: 5000, logo: "💰" },
];
