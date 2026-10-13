import { NextResponse } from "next/server";
import { claimVendorPayout } from "@/lib/network-db";

export async function POST(request: Request) {
  try {
    const { vendor_id } = await request.json();
    
    if (!vendor_id) {
      return NextResponse.json({ error: "Missing vendor_id" }, { status: 400 });
    }

    const payout = claimVendorPayout(vendor_id);
    
    return NextResponse.json(payout);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Claim failed" }, { status: 500 });
  }
}
