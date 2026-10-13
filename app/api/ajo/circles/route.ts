import { NextResponse } from "next/server";
import {
  getCircles,
  createCircle,
  getMembersByCircle,
  getContributionsByRound,
  getPayoutByRound,
} from "@/lib/ajo-db";

// GET — list all circles (with enriched info for the home page cards)
export async function GET() {
  try {
    const circles = getCircles();

    const enriched = circles.map((circle) => {
      const members = getMembersByCircle(circle.id);
      const currentContributions = getContributionsByRound(circle.id, circle.current_round);
      const paidCount = currentContributions.filter((c) => c.status === "paid").length;
      const currentPayout = getPayoutByRound(circle.id, circle.current_round);
      const currentRecipient = members.find(
        (m) => m.id === currentPayout?.recipient_member_id
      );

      return {
        ...circle,
        member_count: members.length,
        pot_size: circle.contribution_amount * members.length,
        paid_this_round: paidCount,
        current_recipient_name: currentRecipient?.display_name ?? null,
      };
    });

    return NextResponse.json(enriched);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch circles" }, { status: 500 });
  }
}

// POST — create a new circle
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contribution_amount, frequency, max_members, created_by, display_name } = body;

    if (!name || !contribution_amount || !frequency || !created_by) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = createCircle({
      name,
      contribution_amount: Number(contribution_amount),
      currency: "USDT",
      frequency,
      max_members: Number(max_members) || 10,
      created_by,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create circle" }, { status: 500 });
  }
}
