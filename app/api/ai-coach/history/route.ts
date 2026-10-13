import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!userId) return NextResponse.json({ error: "User is required." }, { status: 400 });
  const { data, error } = await supabase.from("ai_coach_conversations").select("user_message, coach_reply, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
