import { NextResponse } from "next/server";
import { getReputationByUser, upsertReputation } from "@/lib/ajo-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  const rep = getReputationByUser(user_id);
  if (!rep) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rep);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { user_id, ...patch } = body;
    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });
    const updated = upsertReputation(user_id, patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
