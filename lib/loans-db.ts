import fs from "fs";
import path from "path";
import { setVaultLocked, getVaultForUser } from "@/lib/yield-db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MicroLoan {
  id: string;
  user_id: string;
  principal: number;
  fee: number;
  total_repayable: number;
  collateral_amount: number;
  term_days: 7 | 30;
  status: 'active' | 'repaid' | 'auto_repaid' | 'defaulted';
  disbursed_at: string;
  due_at: string;
  repaid_at: string | null;
  repayment_source: 'manual' | 'auto_vault' | null;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  method: 'manual' | 'auto_vault';
  repaid_at: string;
}

export interface LoansDb {
  loans: MicroLoan[]; // active loans
  history: MicroLoan[]; // all loans
  repayments: LoanRepayment[];
}

export interface CreditStanding {
  repaid_count: number;
  badge: "New Member" | "Trusted Borrower" | "Reliable Member" | "Gold Member";
  borrowing_power_pct: number;
  emoji: string;
}

// ─── Database Operations ──────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "data", "loans.json");

const readDb = (): LoansDb => {
  if (!fs.existsSync(DB_PATH)) {
    return { loans: [], history: [], repayments: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as LoansDb;
};

const writeDb = (db: LoansDb) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

// ─── Credit Logic ─────────────────────────────────────────────────────────────

export const getCreditStanding = (user_id: string): CreditStanding => {
  const db = readDb();
  // Count successfully repaid loans
  const repaidCount = db.history.filter(l => l.user_id === user_id && (l.status === 'repaid' || l.status === 'auto_repaid')).length;
  
  if (repaidCount >= 5) {
    return { repaid_count: repaidCount, badge: "Gold Member", borrowing_power_pct: 0.50, emoji: "🥇" };
  } else if (repaidCount >= 3) {
    return { repaid_count: repaidCount, badge: "Reliable Member", borrowing_power_pct: 0.45, emoji: "🥈" };
  } else if (repaidCount >= 1) {
    return { repaid_count: repaidCount, badge: "Trusted Borrower", borrowing_power_pct: 0.40, emoji: "🥉" };
  } else {
    return { repaid_count: repaidCount, badge: "New Member", borrowing_power_pct: 0.40, emoji: "🌱" };
  }
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getActiveLoan = (user_id: string): MicroLoan | null => {
  const db = readDb();
  const loan = db.loans.find(l => l.user_id === user_id && l.status === 'active');
  return loan || null;
};

export const getLoanHistory = (user_id: string): MicroLoan[] => {
  const db = readDb();
  return db.history.filter(l => l.user_id === user_id).sort((a, b) => new Date(b.disbursed_at).getTime() - new Date(a.disbursed_at).getTime());
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const takeLoan = (user_id: string, principal: number, term_days: 7 | 30): MicroLoan => {
  const activeLoan = getActiveLoan(user_id);
  if (activeLoan) throw new Error("You already have an active loan.");

  const vault = getVaultForUser(user_id);
  if (vault.principal <= 0) throw new Error("No collateral in vault.");

  const standing = getCreditStanding(user_id);
  const maxBorrow = vault.principal * standing.borrowing_power_pct;

  if (principal > maxBorrow) {
    throw new Error(`Requested amount exceeds your maximum borrowing power of $${maxBorrow.toFixed(2)}.`);
  }

  const fee = principal * 0.02; // 2% flat fee
  const total_repayable = principal + fee;
  const now = new Date();
  
  const due = new Date(now);
  due.setDate(due.getDate() + term_days);

  const newLoan: MicroLoan = {
    id: crypto.randomUUID(),
    user_id,
    principal,
    fee,
    total_repayable,
    collateral_amount: vault.principal,
    term_days,
    status: 'active',
    disbursed_at: now.toISOString(),
    due_at: due.toISOString(),
    repaid_at: null,
    repayment_source: null
  };

  const db = readDb();
  db.loans.push(newLoan);
  db.history.push(newLoan);
  writeDb(db);

  // Lock the vault collateral
  setVaultLocked(user_id, true);

  return newLoan;
};

export const repayLoan = (user_id: string): LoanRepayment => {
  const db = readDb();
  const loanIdx = db.loans.findIndex(l => l.user_id === user_id && l.status === 'active');
  
  if (loanIdx === -1) throw new Error("No active loan to repay.");

  const loan = db.loans[loanIdx];
  const now = new Date().toISOString();

  // Mark loan as repaid
  loan.status = 'repaid';
  loan.repaid_at = now;
  loan.repayment_source = 'manual';

  // Update history
  const histIdx = db.history.findIndex(h => h.id === loan.id);
  if (histIdx !== -1) {
    db.history[histIdx] = loan;
  }

  // Remove from active loans
  db.loans.splice(loanIdx, 1);

  // Create repayment log
  const repayment: LoanRepayment = {
    id: crypto.randomUUID(),
    loan_id: loan.id,
    user_id,
    amount: loan.total_repayable,
    method: 'manual',
    repaid_at: now
  };
  db.repayments.push(repayment);

  writeDb(db);

  // Unlock the vault
  setVaultLocked(user_id, false);

  return repayment;
};

export const autoRepayLoanFromVault = (user_id: string): LoanRepayment | null => {
  const db = readDb();
  const loanIdx = db.loans.findIndex(l => l.user_id === user_id && l.status === 'active');
  if (loanIdx === -1) return null;

  const loan = db.loans[loanIdx];
  const now = new Date();
  
  // Logic allows early auto-repayment simulation for demo purposes
  // Realistically we check: if (new Date(loan.due_at) > now) return null;

  const vault = getVaultForUser(user_id);
  
  // Deduct from vault principal
  // (In a real app, we would use a proper yield-db debit method)
  // For MVP, we will directly require the yield-db to expose a deduct method,
  // but to avoid circular deps and complex DB sync, we'll simulate it by unlocking
  // and logging it.
  
  loan.status = 'auto_repaid';
  loan.repaid_at = now.toISOString();
  loan.repayment_source = 'auto_vault';

  // Update history
  const histIdx = db.history.findIndex(h => h.id === loan.id);
  if (histIdx !== -1) db.history[histIdx] = loan;
  db.loans.splice(loanIdx, 1);

  const repayment: LoanRepayment = {
    id: crypto.randomUUID(),
    loan_id: loan.id,
    user_id,
    amount: loan.total_repayable,
    method: 'auto_vault',
    repaid_at: now.toISOString()
  };
  db.repayments.push(repayment);
  writeDb(db);
  
  setVaultLocked(user_id, false);
  return repayment;
};
