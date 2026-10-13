import { NextResponse } from "next/server";
import { getContributionByMemberAndRound, payContribution } from "@/lib/ajo-db";

// POST — mark a member's contribution as paid
export async function POST(request: Request) {
  try {
    const { member_id, circle_id, round_number } = await request.json();

    if (!member_id || !circle_id || !round_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const contribution = getContributionByMemberAndRound(member_id, circle_id, round_number);
    if (!contribution) {
      return NextResponse.json({ error: "Contribution record not found" }, { status: 404 });
    }
    if (contribution.status === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 409 });
    }

    const updated = payContribution(contribution.id);
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to record contribution" }, { status: 500 });
  }
}
