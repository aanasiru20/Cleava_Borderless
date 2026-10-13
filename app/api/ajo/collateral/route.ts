import { NextResponse } from "next/server";
import { slashMemberCollateral, getMembersByCircle, getCircleById } from "@/lib/ajo-db";

// POST — slash a member's collateral (called from mark-round)
export async function POST(request: Request) {
  try {
    const { member_id, circle_id, round_number } = await request.json();
    if (!member_id || !circle_id || !round_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const circle = getCircleById(circle_id);
    if (!circle) return NextResponse.json({ error: "Circle not found" }, { status: 404 });

    const result = slashMemberCollateral(member_id, circle_id, round_number, circle.contribution_amount);
    if (!result) {
      return NextResponse.json({ error: "Cannot slash: member not found or insufficient collateral" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to slash collateral" }, { status: 500 });
  }
}
