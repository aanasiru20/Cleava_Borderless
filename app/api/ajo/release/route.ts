import { NextResponse } from "next/server";
import { releasePayout, getMembersByCircle, getCircleById } from "@/lib/ajo-db";

// POST — release the pot to the current round's recipient
export async function POST(request: Request) {
  try {
    const { circle_id, round_number } = await request.json();

    if (!circle_id || !round_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = releasePayout(circle_id, round_number);
    if (!result) {
      return NextResponse.json({ error: "Payout not found or already released" }, { status: 404 });
    }

    // Build a response with updated circle state
    const updatedCircle = getCircleById(circle_id);
    const updatedMembers = getMembersByCircle(circle_id);

    return NextResponse.json({
      payout: result.payout,
      next_round: result.nextRound,
      circle: updatedCircle,
      members: updatedMembers,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to release payout" }, { status: 500 });
  }
}
