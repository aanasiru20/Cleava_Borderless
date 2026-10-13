import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorNetwork {
  id: string;
  name: string;
  campus: string;
  created_by: string;
  total_pool_balance: number;
  total_vendors: number;
  total_transactions: number;
  network_code: string;
  is_active: boolean;
  created_at: string;
}

export type VendorCategory = 'food' | 'print' | 'bookstore' | 'pharmacy' | 'fashion' | 'tech' | 'other';

export interface Vendor {
  id: string;
  network_id: string;
  user_id: string;
  business_name: string;
  category: VendorCategory;
  qr_code: string;
  vendor_code: string;
  today_earnings: number;
  total_earnings: number;
  pending_payout: number;
  is_verified: boolean;
  joined_at: string;
}

export interface NetworkTransaction {
  id: string;
  network_id: string;
  vendor_id: string;
  payer_user_id: string;
  amount_usdt: number;
  naira_equivalent: number;
  item_description: string;
  status: 'pending' | 'settled' | 'refunded';
  settled_at: string;
}

export interface VendorPayout {
  id: string;
  vendor_id: string;
  network_id: string;
  amount: number;
  period_start: string | null;
  period_end: string | null;
  status: 'pending' | 'claimed' | 'processing';
  claimed_at: string;
}

export interface NetworkDb {
  networks: VendorNetwork[];
  vendors: Vendor[];
  transactions: NetworkTransaction[];
  payouts: VendorPayout[];
}

// ─── Database Operations ──────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "data", "network.json");

const readDb = (): NetworkDb => {
  if (!fs.existsSync(DB_PATH)) {
    return { networks: [], vendors: [], transactions: [], payouts: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as NetworkDb;
};

const writeDb = (db: NetworkDb) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getNetworkByCode = (code: string) => {
  return readDb().networks.find(n => n.network_code === code) || null;
};

export const getVendorsByNetwork = (network_id: string) => {
  return readDb().vendors.filter(v => v.network_id === network_id);
};

export const getVendorByCode = (vendor_code: string) => {
  return readDb().vendors.find(v => v.vendor_code === vendor_code) || null;
};

export const getVendorByUser = (user_id: string) => {
  return readDb().vendors.find(v => v.user_id === user_id) || null;
};

export const getVendorTransactions = (vendor_id: string, limit: number = 20) => {
  return readDb().transactions
    .filter(t => t.vendor_id === vendor_id)
    .sort((a, b) => new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime())
    .slice(0, limit);
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const processPayment = (
  vendor_code: string, 
  payer_id: string, 
  amount_usdt: number, 
  naira_equivalent: number, 
  description: string
) => {
  const db = readDb();
  
  const vendorIdx = db.vendors.findIndex(v => v.vendor_code === vendor_code);
  if (vendorIdx === -1) throw new Error("Vendor not found");
  
  const vendor = db.vendors[vendorIdx];
  const networkIdx = db.networks.findIndex(n => n.id === vendor.network_id);
  if (networkIdx === -1) throw new Error("Network not found");

  const now = new Date().toISOString();

  // 1. Update Vendor balances
  db.vendors[vendorIdx].today_earnings += amount_usdt;
  db.vendors[vendorIdx].total_earnings += amount_usdt;
  db.vendors[vendorIdx].pending_payout += amount_usdt;

  // 2. Update Network pool (realistically wouldn't update total_transactions and total_vendors here in a fully normalized SQL, but for our mock we update the cache)
  db.networks[networkIdx].total_pool_balance += amount_usdt;
  db.networks[networkIdx].total_transactions += 1;

  // 3. Create Transaction
  const newTx: NetworkTransaction = {
    id: crypto.randomUUID(),
    network_id: vendor.network_id,
    vendor_id: vendor.id,
    payer_user_id: payer_id,
    amount_usdt,
    naira_equivalent,
    item_description: description,
    status: 'settled',
    settled_at: now
  };
  
  db.transactions.push(newTx);
  writeDb(db);
  
  return newTx;
};

export const claimVendorPayout = (vendor_id: string) => {
  const db = readDb();
  const vendorIdx = db.vendors.findIndex(v => v.id === vendor_id);
  if (vendorIdx === -1) throw new Error("Vendor not found");
  
  const vendor = db.vendors[vendorIdx];
  const amountToClaim = vendor.pending_payout;
  
  if (amountToClaim <= 0) throw new Error("No pending payout");

  const now = new Date().toISOString();

  // Reset pending payout
  db.vendors[vendorIdx].pending_payout = 0;

  // Create Payout Record
  const payout: VendorPayout = {
    id: crypto.randomUUID(),
    vendor_id: vendor.id,
    network_id: vendor.network_id,
    amount: amountToClaim,
    period_start: null,
    period_end: null,
    status: 'claimed',
    claimed_at: now
  };

  db.payouts.push(payout);
  
  // NOTE: In a real implementation, we would subtract from total_pool_balance here
  // and credit the user's actual wallet table, but since our app is an MVP, 
  // the pool balance is an aggregate statistic for the network admin to observe.

  writeDb(db);
  return payout;
};

export const createVendor = (
  user_id: string,
  network_code: string,
  business_name: string,
  category: VendorCategory
) => {
  const db = readDb();
  
  const network = db.networks.find(n => n.network_code === network_code);
  if (!network) throw new Error("Network not found");

  // Generate a random vendor code e.g. VND-XYZ12
  const shortHash = crypto.randomUUID().split("-")[0].toUpperCase().substring(0, 5);
  const vendor_code = `VND-${shortHash}`;
  const qr_code = `cleva://pay/${vendor_code}`;

  const newVendor: Vendor = {
    id: crypto.randomUUID(),
    network_id: network.id,
    user_id,
    business_name,
    category,
    qr_code,
    vendor_code,
    today_earnings: 0,
    total_earnings: 0,
    pending_payout: 0,
    is_verified: false,
    joined_at: new Date().toISOString()
  };

  db.vendors.push(newVendor);
  
  // Update Network stats
  const netIdx = db.networks.findIndex(n => n.id === network.id);
  db.networks[netIdx].total_vendors += 1;

  writeDb(db);
  return newVendor;
};
