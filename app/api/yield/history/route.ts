import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const DEFAULT_USER_ID = "freelancer-123";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || DEFAULT_USER_ID;
  const { data, error } = await supabase.from("yield_transactions").select("id, type, amount, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("Yield history error:", error);
    return NextResponse.json([]);
  }
  return NextResponse.json(data || []);
}
