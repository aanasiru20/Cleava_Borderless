import fs from "fs";
import path from "path";

// Define the Escrow Transaction type
export interface EscrowTransaction {
  id: string;
  freelancer_id: string;
  client_name: string | null;
  client_email: string | null;
  amount_usdt: number;
  job_description: string;
  status: "funded" | "delivered" | "released" | "disputed";
  escrow_code: string;
  funded_at: string;
  delivered_at: string | null;
  released_at: string | null;
  created_at: string;
}

const DB_PATH = path.join(process.cwd(), "data", "escrow.json");

// Helper to ensure the file exists
const ensureDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
};

// Get all escrows
export const getEscrows = (): EscrowTransaction[] => {
  ensureDb();
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data) as EscrowTransaction[];
};

// Get escrow by code
export const getEscrowByCode = (code: string): EscrowTransaction | undefined => {
  const escrows = getEscrows();
  return escrows.find((e) => e.escrow_code === code);
};

// Create a new escrow
export const createEscrow = (
  escrow: Omit<EscrowTransaction, "id" | "status" | "escrow_code" | "funded_at" | "delivered_at" | "released_at" | "created_at">
): EscrowTransaction => {
  const escrows = getEscrows();
  
  // Generate unique 6 character code
  const code = "ESC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newEscrow: EscrowTransaction = {
    ...escrow,
    id: crypto.randomUUID(),
    status: "funded",
    escrow_code: code,
    funded_at: new Date().toISOString(),
    delivered_at: null,
    released_at: null,
    created_at: new Date().toISOString(),
  };

  escrows.push(newEscrow);
  fs.writeFileSync(DB_PATH, JSON.stringify(escrows, null, 2));
  
  return newEscrow;
};

// Update escrow status
export const updateEscrowStatus = (
  code: string,
  newStatus: "delivered" | "released"
): EscrowTransaction | null => {
  const escrows = getEscrows();
  const index = escrows.findIndex((e) => e.escrow_code === code);
  
  if (index === -1) return null;
  
  escrows[index].status = newStatus;
  
  if (newStatus === "delivered") {
    escrows[index].delivered_at = new Date().toISOString();
  } else if (newStatus === "released") {
    escrows[index].released_at = new Date().toISOString();
  }
  
  fs.writeFileSync(DB_PATH, JSON.stringify(escrows, null, 2));
  
  return escrows[index];
};
