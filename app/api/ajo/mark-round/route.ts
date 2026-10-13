import { NextResponse } from "next/server";
import {
  getCircleById, getMembersByCircle, getContributionsByRound,
  getPayoutByRound, slashMemberCollateral, releasePayout
} from "@/lib/ajo-db";

// POST — mark a round complete: auto-slash any pending members, then release pot
export async function POST(request: Request) {
  try {
    const { circle_id } = await request.json();
    if (!circle_id) return NextResponse.json({ error: "circle_id required" }, { status: 400 });

    const circle = getCircleById(circle_id);
    if (!circle) return NextResponse.json({ error: "Circle not found" }, { status: 404 });

    const round = circle.current_round;
    const contributions = getContributionsByRound(circle_id, round);
    const members = getMembersByCircle(circle_id);
    const slashResults: { name: string; amount: number }[] = [];

    // Auto-slash any pending members
    for (const contrib of contributions) {
      if (contrib.status === "pending") {
        const member = members.find((m) => m.id === contrib.member_id);
        if (!member) continue;
        const result = slashMemberCollateral(member.id, circle_id, round, circle.contribution_amount);
        if (result) {
          slashResults.push({ name: member.display_name, amount: circle.contribution_amount });
        }
      }
    }

    // Now release the pot (pot is guaranteed full after slashes)
    const payout = getPayoutByRound(circle_id, round);
    if (!payout || payout.status === "released") {
      return NextResponse.json({ error: "Payout already released or not found" }, { status: 400 });
    }
    const currentRecipient = members.find((m) => m.id === payout.recipient_member_id);
    const releaseResult = releasePayout(circle_id, round);

    return NextResponse.json({
      success: true,
      slashResults,
      recipientName: currentRecipient?.display_name ?? "Unknown",
      potAmount: payout.total_amount,
      nextRound: releaseResult?.nextRound,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to mark round complete" }, { status: 500 });
  }
}
