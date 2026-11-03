import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const DEMO_FREELANCER_ID = "freelancer-123";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get("freelancer_id") || DEMO_FREELANCER_ID;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Error fetching escrows:", error);
    return NextResponse.json({ error: "Failed to fetch escrows" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount_usdt);
    const jobDescription = typeof body.job_description === "string" ? body.job_description.trim() : "";
    const clientEmail = typeof body.client_email === "string" ? body.client_email.trim() : "";

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000 || !jobDescription || jobDescription.length > 500) {
      return NextResponse.json({ error: "Enter a valid amount and job description" }, { status: 400 });
    }
    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: "Enter a valid client email" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const escrowCode = `ESC-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const { data, error } = await supabase
      .from("escrow_transactions")
      .insert({
        freelancer_id: DEMO_FREELANCER_ID,
        freelancer_name: "Demo Freelancer",
        client_name: typeof body.client_name === "string" ? body.client_name.trim().slice(0, 120) : null,
        client_email: clientEmail || null,
        amount_usdt: amount,
        job_description: jobDescription,
        escrow_code: escrowCode,
        status: "funded",
        payout_method: "usdt_wallet",
        freelancer_paypal_email: typeof body.freelancer_paypal_email === "string" ? body.freelancer_paypal_email.trim() : null,
        funded_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating escrow:", error);
    return NextResponse.json({ error: "Failed to create escrow" }, { status: 500 });
  }
}
