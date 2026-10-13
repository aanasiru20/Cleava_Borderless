import fs from "fs";
import path from "path";

export interface DiasporaTransfer {
  id: string;
  student_id: string;
  student_name: string;
  sender_name: string;
  sender_email: string;
  sender_country: string;
  amount_usdt: number;
  payment_method: string;
  personal_message: string;
  transaction_ref: string;
  status: "completed" | "pending";
  created_at: string;
  seen_by_student: boolean;
}

export interface DiasporaDb {
  transfers: DiasporaTransfer[];
}

const DB_PATH = path.join(process.cwd(), "data", "diaspora.json");

const readDb = (): DiasporaDb => {
  if (!fs.existsSync(DB_PATH)) {
    const empty: DiasporaDb = { transfers: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DiasporaDb;
};

const writeDb = (db: DiasporaDb) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

export const createTransfer = (
  data: Omit<DiasporaTransfer, "id" | "transaction_ref" | "status" | "created_at" | "seen_by_student">
): DiasporaTransfer => {
  const db = readDb();
  
  const ref = `CLV-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
  
  const newTransfer: DiasporaTransfer = {
    ...data,
    id: crypto.randomUUID(),
    transaction_ref: ref,
    status: "completed",
    created_at: new Date().toISOString(),
    seen_by_student: false,
  };
  
  db.transfers.push(newTransfer);
  writeDb(db);
  
  return newTransfer;
};

export const getTransfersByStudent = (student_id: string): DiasporaTransfer[] => {
  return readDb().transfers
    .filter((t) => t.student_id === student_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const getUnseenTransfers = (student_id: string): DiasporaTransfer[] => {
  return getTransfersByStudent(student_id).filter((t) => !t.seen_by_student);
};

export const markTransferAsSeen = (id: string): boolean => {
  const db = readDb();
  const idx = db.transfers.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  
  db.transfers[idx].seen_by_student = true;
  writeDb(db);
  return true;
};
