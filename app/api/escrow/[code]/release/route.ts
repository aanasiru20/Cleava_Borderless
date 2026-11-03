import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const payoutMethod = body.payout_method === "paypal" ? "paypal" : "usdt_wallet";
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("escrow_transactions")
      .update({
        status: "released",
        payout_method: payoutMethod,
        released_at: new Date().toISOString(),
        ...(typeof body.paypal_batch_id === "string" ? { paypal_batch_id: body.paypal_batch_id } : {}),
        ...(typeof body.freelancer_paypal_email === "string" ? { freelancer_paypal_email: body.freelancer_paypal_email } : {}),
      })
      .eq("escrow_code", params.code)
      .eq("status", "delivered")
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Escrow is not ready for release" }, { status: 409 });
    return NextResponse.json({ success: true, escrow: data });
  } catch (error) {
    console.error("Error releasing escrow:", error);
    return NextResponse.json({ error: "Failed to release escrow" }, { status: 500 });
  }
}
