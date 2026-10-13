import fs from "fs";
import path from "path";

export interface YieldVault {
  id: string;
  user_id: string;
  principal: number;
  accrued_yield: number;
  apy: number;
  last_accrued_at: string;
  is_active: boolean;
  is_locked: boolean;
  deposited_at: string | null;
  created_at: string;
}

export interface YieldTransaction {
  id: string;
  user_id: string;
  type: "deposit" | "withdraw" | "yield_credit";
  amount: number;
  balance_after: number;
  note: string;
  created_at: string;
}

export interface YieldDb {
  vaults: YieldVault[];
  transactions: YieldTransaction[];
}

const DB_PATH = path.join(process.cwd(), "data", "yield.json");

const readDb = (): YieldDb => {
  if (!fs.existsSync(DB_PATH)) {
    const empty: YieldDb = { vaults: [], transactions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as YieldDb;
};

const writeDb = (db: YieldDb) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// APY Constants
const APY = 8.00;
const MINUTES_PER_YEAR = 525600;
const PER_MINUTE_RATE = (APY / 100) / MINUTES_PER_YEAR; 
const DEMO_MULTIPLIER = 1440; // 1 real minute = 1 simulated day

// ─── Vault Queries ────────────────────────────────────────────────────────────

export const getVaultForUser = (user_id: string): YieldVault => {
  const db = readDb();
  let vault = db.vaults.find(v => v.user_id === user_id);
  
  if (!vault) {
    vault = {
      id: crypto.randomUUID(),
      user_id,
      principal: 0,
      accrued_yield: 0,
      apy: APY,
      last_accrued_at: new Date().toISOString(),
      is_active: false,
      is_locked: false,
      deposited_at: null,
      created_at: new Date().toISOString()
    };
    db.vaults.push(vault);
    writeDb(db);
  }

  // Accrue pending yield if active
  if (vault.is_active && vault.principal > 0) {
    const now = new Date();
    const last = new Date(vault.last_accrued_at);
    const msElapsed = now.getTime() - last.getTime();
    const minutesElapsed = msElapsed / 60000;

    if (minutesElapsed > 0.05) { // Accrue if at least a few seconds passed
      const simulatedMinutes = minutesElapsed * DEMO_MULTIPLIER;
      const newYield = vault.principal * (PER_MINUTE_RATE * simulatedMinutes);
      
      vault.accrued_yield += newYield;
      vault.last_accrued_at = now.toISOString();

      // Log a micro-credit yield transaction to build the history feed
      if (newYield > 0.000001) {
        db.transactions.push({
          id: crypto.randomUUID(),
          user_id,
          type: "yield_credit",
          amount: newYield,
          balance_after: vault.principal + vault.accrued_yield,
          note: "Yield accrued automatically",
          created_at: now.toISOString()
        });
      }

      writeDb(db);
    }
  }

  return vault;
};

export const depositToVault = (user_id: string, amount: number): YieldVault => {
  const db = readDb();
  let vaultIdx = db.vaults.findIndex(v => v.user_id === user_id);
  
  if (vaultIdx === -1) {
    getVaultForUser(user_id); // Ensures creation
    const freshDb = readDb();
    vaultIdx = freshDb.vaults.findIndex(v => v.user_id === user_id);
    db.vaults = freshDb.vaults;
  }

  const now = new Date().toISOString();
  db.vaults[vaultIdx].principal += amount;
  db.vaults[vaultIdx].is_active = true;
  if (!db.vaults[vaultIdx].deposited_at) {
    db.vaults[vaultIdx].deposited_at = now;
  }
  db.vaults[vaultIdx].last_accrued_at = now;

  db.transactions.push({
    id: crypto.randomUUID(),
    user_id,
    type: "deposit",
    amount,
    balance_after: db.vaults[vaultIdx].principal,
    note: `Deposited $${amount.toFixed(2)} USDT to vault`,
    created_at: now
  });

  writeDb(db);
  return db.vaults[vaultIdx];
};

export const withdrawFromVault = (user_id: string): { total: number, principal: number, yield: number } => {
  const db = readDb();
  const vaultIdx = db.vaults.findIndex(v => v.user_id === user_id);
  
  if (vaultIdx === -1 || db.vaults[vaultIdx].principal === 0) {
    return { total: 0, principal: 0, yield: 0 };
  }

  // Force one last accrual before withdraw
  const vault = getVaultForUser(user_id);
  const finalDb = readDb(); // reload db after accrual
  const finalVaultIdx = finalDb.vaults.findIndex(v => v.user_id === user_id);
  
  const p = finalDb.vaults[finalVaultIdx].principal;
  const y = finalDb.vaults[finalVaultIdx].accrued_yield;
  const total = p + y;

  finalDb.vaults[finalVaultIdx].principal = 0;
  finalDb.vaults[finalVaultIdx].accrued_yield = 0;
  finalDb.vaults[finalVaultIdx].is_active = false;
  finalDb.vaults[finalVaultIdx].deposited_at = null;
  
  finalDb.transactions.push({
    id: crypto.randomUUID(),
    user_id,
    type: "withdraw",
    amount: total,
    balance_after: 0,
    note: `Withdrew $${p.toFixed(2)} principal + $${y.toFixed(6)} yield`,
    created_at: new Date().toISOString()
  });

  writeDb(finalDb);
  return { total, principal: p, yield: y };
};

// ─── Transaction Queries ──────────────────────────────────────────────────────
export const getTransactionHistory = (user_id: string, limit: number = 20): YieldTransaction[] => {
  return readDb().transactions
    .filter(t => t.user_id === user_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
};

export const setVaultLocked = (user_id: string, is_locked: boolean): void => {
  const db = readDb();
  const vaultIdx = db.vaults.findIndex(v => v.user_id === user_id);
  if (vaultIdx !== -1) {
    db.vaults[vaultIdx].is_locked = is_locked;
    writeDb(db);
  }
};
