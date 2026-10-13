import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AjoCircle {
  id: string; name: string; created_by: string;
  contribution_amount: number; currency: string;
  frequency: "weekly" | "biweekly" | "monthly";
  max_members: number; status: "forming" | "active" | "completed";
  current_round: number; invite_code: string; created_at: string;
}

export interface AjoMember {
  id: string; circle_id: string; user_id: string;
  display_name: string; payout_position: number;
  has_received_payout: boolean; joined_at: string;
  // Collateral fields
  collateral_amount: number;
  collateral_status: "unlocked" | "locked" | "slashed" | "released";
  collateral_locked_at: string | null;
  missed_contributions: number;
  commitment_tx_hash: string | null;
  signed_contract_at: string | null;
  mandate_preview_signed: boolean;
}

export interface AjoContribution {
  id: string; circle_id: string; member_id: string;
  round_number: number; amount: number;
  status: "pending" | "paid" | "missed";
  paid_at: string | null; created_at: string;
}

export interface AjoPayout {
  id: string; circle_id: string; recipient_member_id: string;
  round_number: number; total_amount: number;
  status: "pending" | "released"; released_at: string | null;
}

export interface AjoCollateralEvent {
  id: string; circle_id: string; member_id: string;
  event_type: "locked" | "slashed" | "released" | "topped_up";
  amount: number; round_number: number | null;
  reason: string; created_at: string;
}

export interface AjoReputation {
  id: string; user_id: string;
  circles_completed: number; circles_defaulted: number;
  total_contributed: number; reputation_score: number;
  tier: "New Member" | "Trusted" | "Reliable" | "Gold Circle" | "Blacklisted";
  updated_at: string;
}

export interface AjoDb {
  circles: AjoCircle[]; members: AjoMember[];
  contributions: AjoContribution[]; payouts: AjoPayout[];
  collateral_events: AjoCollateralEvent[];
  reputation: AjoReputation[];
}

// ─── File I/O ─────────────────────────────────────────────────────────────────
const DB_PATH = path.join(process.cwd(), "data", "ajo.json");

const readDb = (): AjoDb => {
  if (!fs.existsSync(DB_PATH)) {
    const empty: AjoDb = { circles: [], members: [], contributions: [], payouts: [], collateral_events: [], reputation: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  // Ensure new arrays exist even on old data files
  if (!raw.collateral_events) raw.collateral_events = [];
  if (!raw.reputation) raw.reputation = [];
  return raw as AjoDb;
};

const writeDb = (db: AjoDb) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// ─── Tier Calculation ─────────────────────────────────────────────────────────
export const calcTier = (score: number, completed: number, defaulted: number): AjoReputation["tier"] => {
  if (score < 40 || defaulted >= 3) return "Blacklisted";
  if (score >= 95 && completed >= 5) return "Gold Circle";
  if (score >= 85 && completed >= 3) return "Reliable";
  if (score >= 85 && completed >= 1) return "Trusted";
  if (completed === 0 && score >= 85) return "Trusted"; // Allow fresh joiners with slashes
  return "New Member";
};

// ─── Circle Queries ───────────────────────────────────────────────────────────
export const getCircles = (): AjoCircle[] => readDb().circles;

export const getCircleById = (id: string): AjoCircle | undefined =>
  readDb().circles.find((c) => c.id === id);

export const getCircleByInviteCode = (code: string): AjoCircle | undefined =>
  readDb().circles.find((c) => c.invite_code === code);

export const createCircle = (
  data: Omit<AjoCircle, "id" | "status" | "current_round" | "invite_code" | "created_at">
): { circle: AjoCircle; member: AjoMember } => {
  const db = readDb();
  const invite_code = "AJO-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  const newCircle: AjoCircle = { ...data, id: crypto.randomUUID(), status: "forming", current_round: 1, invite_code, created_at: new Date().toISOString() };
  const creatorMember: AjoMember = {
    id: crypto.randomUUID(), circle_id: newCircle.id, user_id: data.created_by,
    display_name: "Me", payout_position: 1, has_received_payout: false, joined_at: new Date().toISOString(),
    collateral_amount: data.contribution_amount, collateral_status: "locked",
    collateral_locked_at: new Date().toISOString(), missed_contributions: 0,
    commitment_tx_hash: "TX" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    signed_contract_at: new Date().toISOString(), mandate_preview_signed: false,
  };
  db.circles.push(newCircle);
  db.members.push(creatorMember);
  db.collateral_events.push({
    id: crypto.randomUUID(), circle_id: newCircle.id, member_id: creatorMember.id,
    event_type: "locked", amount: data.contribution_amount, round_number: null,
    reason: "Joined circle — collateral locked", created_at: new Date().toISOString(),
  });
  db.contributions.push({
    id: crypto.randomUUID(), circle_id: newCircle.id, member_id: creatorMember.id,
    round_number: 1, amount: data.contribution_amount, status: "pending",
    paid_at: null, created_at: new Date().toISOString(),
  });
  writeDb(db);
  return { circle: newCircle, member: creatorMember };
};

// ─── Member Queries ───────────────────────────────────────────────────────────
export const getMembersByCircle = (circle_id: string): AjoMember[] =>
  readDb().members.filter((m) => m.circle_id === circle_id).sort((a, b) => a.payout_position - b.payout_position);

export const getMemberByUserAndCircle = (user_id: string, circle_id: string): AjoMember | undefined =>
  readDb().members.find((m) => m.user_id === user_id && m.circle_id === circle_id);

export const addMemberToCircle = (
  circle_id: string, user_id: string, display_name: string, contribution_amount: number
): AjoMember => {
  const db = readDb();
  const existingMembers = db.members.filter((m) => m.circle_id === circle_id);
  const txHash = "TX" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const newMember: AjoMember = {
    id: crypto.randomUUID(), circle_id, user_id, display_name,
    payout_position: existingMembers.length + 1, has_received_payout: false, joined_at: new Date().toISOString(),
    collateral_amount: contribution_amount, collateral_status: "locked",
    collateral_locked_at: new Date().toISOString(), missed_contributions: 0,
    commitment_tx_hash: txHash, signed_contract_at: new Date().toISOString(),
    mandate_preview_signed: false,
  };
  db.members.push(newMember);
  db.collateral_events.push({
    id: crypto.randomUUID(), circle_id, member_id: newMember.id,
    event_type: "locked", amount: contribution_amount, round_number: null,
    reason: "Joined circle — collateral locked", created_at: new Date().toISOString(),
  });
  db.contributions.push({
    id: crypto.randomUUID(), circle_id: circle_id, member_id: newMember.id,
    round_number: 1, amount: contribution_amount, status: "pending",
    paid_at: null, created_at: new Date().toISOString(),
  });
  writeDb(db);
  return newMember;
};

export const signMandatePreview = (user_id: string, circle_id: string): boolean => {
  const db = readDb();
  const idx = db.members.findIndex((m) => m.user_id === user_id && m.circle_id === circle_id);
  if (idx === -1) return false;
  db.members[idx].mandate_preview_signed = true;
  writeDb(db);
  return true;
};

// ─── Contribution Queries ─────────────────────────────────────────────────────
export const getContributionsByRound = (circle_id: string, round_number: number): AjoContribution[] =>
  readDb().contributions.filter((c) => c.circle_id === circle_id && c.round_number === round_number);

export const getContributionByMemberAndRound = (
  member_id: string, circle_id: string, round_number: number
): AjoContribution | undefined =>
  readDb().contributions.find((c) => c.member_id === member_id && c.circle_id === circle_id && c.round_number === round_number);

export const payContribution = (contribution_id: string): AjoContribution | null => {
  const db = readDb();
  const idx = db.contributions.findIndex((c) => c.id === contribution_id);
  if (idx === -1) return null;
  db.contributions[idx].status = "paid";
  db.contributions[idx].paid_at = new Date().toISOString();
  writeDb(db);
  return db.contributions[idx];
};

// ─── Collateral & Slash Logic ─────────────────────────────────────────────────
export const slashMemberCollateral = (
  member_id: string, circle_id: string, round_number: number, slash_amount: number
): { member: AjoMember; event: AjoCollateralEvent } | null => {
  const db = readDb();
  const mIdx = db.members.findIndex((m) => m.id === member_id);
  if (mIdx === -1) return null;
  const member = db.members[mIdx];
  if (member.collateral_status !== "locked" || member.collateral_amount < slash_amount) return null;

  // Deduct from collateral
  db.members[mIdx].collateral_amount = parseFloat((member.collateral_amount - slash_amount).toFixed(2));
  db.members[mIdx].missed_contributions += 1;

  // Slash event
  const event: AjoCollateralEvent = {
    id: crypto.randomUUID(), circle_id, member_id, event_type: "slashed",
    amount: slash_amount, round_number, reason: `Missed Round ${round_number} contribution — auto-slashed to pot`,
    created_at: new Date().toISOString(),
  };
  db.collateral_events.push(event);

  // Mark the missed contribution as paid-via-collateral
  const cIdx = db.contributions.findIndex(
    (c) => c.member_id === member_id && c.circle_id === circle_id && c.round_number === round_number
  );
  if (cIdx !== -1) {
    db.contributions[cIdx].status = "paid";
    db.contributions[cIdx].paid_at = new Date().toISOString();
  }

  // Update reputation
  const rIdx = db.reputation.findIndex((r) => r.user_id === member.user_id);
  if (rIdx !== -1) {
    const newScore = Math.max(0, db.reputation[rIdx].reputation_score - 15);
    const newMisses = db.members[mIdx].missed_contributions;
    db.reputation[rIdx].reputation_score = newScore;
    db.reputation[rIdx].tier = calcTier(newScore, db.reputation[rIdx].circles_completed, db.reputation[rIdx].circles_defaulted + (newMisses >= 3 ? 1 : 0));
    if (newMisses >= 3) db.reputation[rIdx].circles_defaulted += 1;
    db.reputation[rIdx].updated_at = new Date().toISOString();
  }

  writeDb(db);
  return { member: db.members[mIdx], event };
};

// ─── Payout Queries ───────────────────────────────────────────────────────────
export const getPayoutByRound = (circle_id: string, round_number: number): AjoPayout | undefined =>
  readDb().payouts.find((p) => p.circle_id === circle_id && p.round_number === round_number);

export const releasePayout = (circle_id: string, round_number: number): { payout: AjoPayout; nextRound: number } | null => {
  const db = readDb();
  const payoutIdx = db.payouts.findIndex((p) => p.circle_id === circle_id && p.round_number === round_number);
  if (payoutIdx === -1) return null;

  db.payouts[payoutIdx].status = "released";
  db.payouts[payoutIdx].released_at = new Date().toISOString();

  const recipientId = db.payouts[payoutIdx].recipient_member_id;
  const memberIdx = db.members.findIndex((m) => m.id === recipientId);
  if (memberIdx !== -1) {
    db.members[memberIdx].has_received_payout = true;
    // Update reputation for completing a round as recipient
    const rIdx = db.reputation.findIndex((r) => r.user_id === db.members[memberIdx].user_id);
    if (rIdx !== -1) {
      db.reputation[rIdx].circles_completed += 1;
      const s = db.reputation[rIdx].reputation_score;
      const c = db.reputation[rIdx].circles_completed;
      db.reputation[rIdx].tier = calcTier(s, c, db.reputation[rIdx].circles_defaulted);
    }
  }

  const circleIdx = db.circles.findIndex((c) => c.id === circle_id);
  if (circleIdx === -1) return null;
  const nextRound = db.circles[circleIdx].current_round + 1;
  db.circles[circleIdx].current_round = nextRound;

  const members = db.members.filter((m) => m.circle_id === circle_id).sort((a, b) => a.payout_position - b.payout_position);
  if (nextRound <= members.length) {
    const ca = db.circles[circleIdx].contribution_amount;
    for (const m of members) {
      db.contributions.push({
        id: crypto.randomUUID(), circle_id, member_id: m.id, round_number: nextRound,
        amount: ca, status: "pending", paid_at: null, created_at: new Date().toISOString(),
      });
    }
    const nextRecipient = members.find((m) => m.payout_position === nextRound);
    if (nextRecipient) {
      db.payouts.push({
        id: crypto.randomUUID(), circle_id, recipient_member_id: nextRecipient.id,
        round_number: nextRound, total_amount: ca * members.length, status: "pending", released_at: null,
      });
    }
  } else {
    db.circles[circleIdx].status = "completed";
    // Release all collateral on completion
    for (const m of members) {
      const mIdx = db.members.findIndex((mem) => mem.id === m.id);
      if (mIdx !== -1 && db.members[mIdx].collateral_status === "locked") {
        db.members[mIdx].collateral_status = "released";
        db.collateral_events.push({
          id: crypto.randomUUID(), circle_id, member_id: m.id, event_type: "released",
          amount: db.members[mIdx].collateral_amount, round_number: null,
          reason: "Circle completed — collateral returned", created_at: new Date().toISOString(),
        });
      }
    }
  }

  writeDb(db);
  return { payout: db.payouts[payoutIdx], nextRound };
};

// ─── Collateral Event & Reputation Queries ────────────────────────────────────
export const getCollateralEventsByCircle = (circle_id: string): AjoCollateralEvent[] =>
  readDb().collateral_events.filter((e) => e.circle_id === circle_id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const getReputationByUser = (user_id: string): AjoReputation | undefined =>
  readDb().reputation.find((r) => r.user_id === user_id);

export const upsertReputation = (user_id: string, patch: Partial<AjoReputation>): AjoReputation => {
  const db = readDb();
  const idx = db.reputation.findIndex((r) => r.user_id === user_id);
  const now = new Date().toISOString();
  if (idx === -1) {
    const newRep: AjoReputation = {
      id: crypto.randomUUID(), user_id, circles_completed: 0, circles_defaulted: 0,
      total_contributed: 0, reputation_score: 100, tier: "New Member", updated_at: now, ...patch,
    };
    db.reputation.push(newRep);
    writeDb(db);
    return newRep;
  }
  db.reputation[idx] = { ...db.reputation[idx], ...patch, updated_at: now };
  writeDb(db);
  return db.reputation[idx];
};
