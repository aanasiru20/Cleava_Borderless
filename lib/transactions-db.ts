import fs from "fs";
import path from "path";

export interface WalletTransaction {
  id: string;
  user_id: string;
  type:
    | "naira_conversion"
    | "diaspora_receive"
    | "usdt_deposit"
    | "escrow_release"
    | "ajo_payout"
    | "loan_disbursement"
    | "yield_credit"
    | "vendor_payout";
  amount_usdt: number;
  amount_naira: number;
  exchange_rate: number;
  fee_usdt: number;
  reference: string;
  description: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface TransactionsDb {
  transactions: WalletTransaction[];
}

const DB_PATH = path.join(process.cwd(), "data", "transactions.json");

const readDb = (): TransactionsDb => {
  if (!fs.existsSync(DB_PATH)) {
    const empty: TransactionsDb = { transactions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as TransactionsDb;
};

const writeDb = (db: TransactionsDb) =>
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

export const createTransaction = (
  data: Omit<WalletTransaction, "id" | "reference" | "created_at">
): WalletTransaction => {
  const db = readDb();

  const ref = `CLV-ADD-${new Date().getFullYear()}-${Math.floor(
    Math.random() * 10000
  )
    .toString()
    .padStart(4, "0")}`;

  const newTx: WalletTransaction = {
    ...data,
    id: crypto.randomUUID(),
    reference: ref,
    created_at: new Date().toISOString(),
  };

  db.transactions.unshift(newTx); // newest first
  writeDb(db);
  return newTx;
};

export const getTransactionsByUser = (
  user_id: string
): WalletTransaction[] => {
  return readDb().transactions.filter((t) => t.user_id === user_id);
};

export const getUserBalance = (user_id: string): number => {
  return getTransactionsByUser(user_id).reduce((acc, t) => {
    if (t.status !== "completed") return acc;
    const sign =
      ["naira_conversion", "diaspora_receive", "usdt_deposit"].includes(t.type)
        ? 1
        : -1;
    return acc + sign * t.amount_usdt;
  }, 0);
};
