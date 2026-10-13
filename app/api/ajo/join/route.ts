import { NextResponse } from "next/server";
import { getCircleByInviteCode, addMemberToCircle, getMembersByCircle } from "@/lib/ajo-db";

export async function POST(request: Request) {
  try {
    const { invite_code, user_id, display_name } = await request.json();
    if (!invite_code || !user_id || !display_name) {
      return NextResponse.json({ error: "Missing invite_code, user_id, or display_name" }, { status: 400 });
    }

    const circle = getCircleByInviteCode(invite_code.toUpperCase());
    if (!circle) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });

    const existingMembers = getMembersByCircle(circle.id);
    if (existingMembers.length >= circle.max_members) {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }

    const alreadyMember = existingMembers.find((m) => m.user_id === user_id);
    if (alreadyMember) {
      return NextResponse.json({ error: "Already a member", circle_id: circle.id }, { status: 409 });
    }

    const newMember = addMemberToCircle(circle.id, user_id, display_name, circle.contribution_amount);
    return NextResponse.json({ member: newMember, circle_id: circle.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to join circle" }, { status: 500 });
  }
}
