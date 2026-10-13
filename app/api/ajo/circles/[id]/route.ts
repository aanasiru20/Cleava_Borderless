import { NextResponse } from "next/server";
import {
  getCircleById, getMembersByCircle, getContributionsByRound,
  getPayoutByRound, getCollateralEventsByCircle, getReputationByUser,
} from "@/lib/ajo-db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const circle = getCircleById(params.id);
    if (!circle) return NextResponse.json({ error: "Circle not found" }, { status: 404 });

    const members = getMembersByCircle(circle.id);
    const contributions = getContributionsByRound(circle.id, circle.current_round);
    const currentPayout = getPayoutByRound(circle.id, circle.current_round);
    const collateralEvents = getCollateralEventsByCircle(circle.id).slice(0, 10);

    // Enrich contributions with display names
    const enrichedContributions = contributions.map((c) => {
      const member = members.find((m) => m.id === c.member_id);
      return { ...c, display_name: member?.display_name ?? "Unknown" };
    });

    // Enrich members with their reputation
    const enrichedMembers = members.map((m) => {
      const rep = getReputationByUser(m.user_id);
      return { ...m, reputation: rep ?? null };
    });

    // Enrich collateral events with member display names
    const enrichedEvents = collateralEvents.map((e) => {
      const member = members.find((m) => m.id === e.member_id);
      return { ...e, display_name: member?.display_name ?? "Unknown" };
    });

    return NextResponse.json({
      circle, members: enrichedMembers,
      contributions: enrichedContributions, currentPayout,
      collateralEvents: enrichedEvents,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch circle" }, { status: 500 });
  }
}
