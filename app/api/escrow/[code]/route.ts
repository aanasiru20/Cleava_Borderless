import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type RouteContext = { params: { code: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("escrow_code", params.code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching escrow:", error);
    return NextResponse.json({ error: "Failed to fetch escrow" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const allowedStatuses = ["delivered", "released"] as const;
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status: body.status };
    if (body.status === "delivered") updates.delivered_at = new Date().toISOString();
    if (body.status === "released") updates.released_at = new Date().toISOString();
    if (body.payout_method === "usdt_wallet" || body.payout_method === "paypal") updates.payout_method = body.payout_method;
    if (typeof body.paypal_batch_id === "string") updates.paypal_batch_id = body.paypal_batch_id;
    if (typeof body.freelancer_paypal_email === "string") updates.freelancer_paypal_email = body.freelancer_paypal_email;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("escrow_transactions")
      .update(updates)
      .eq("escrow_code", params.code)
      .eq("status", body.status === "released" ? "delivered" : "funded")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Escrow is not ready for this transition" }, { status: 409 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating escrow:", error);
    return NextResponse.json({ error: "Failed to update escrow" }, { status: 500 });
  }
}
