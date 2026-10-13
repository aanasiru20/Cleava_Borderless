import { NextResponse } from "next/server";
import { getEscrowByCode, updateEscrowStatus } from "@/lib/db";

// GET a specific escrow by its code (for the Client Page)
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const escrow = getEscrowByCode(params.code);
    
    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }
    
    return NextResponse.json(escrow);
  } catch (error) {
    console.error("Error fetching escrow:", error);
    return NextResponse.json({ error: "Failed to fetch escrow" }, { status: 500 });
  }
}

// PATCH to update escrow status (mark as delivered or released)
export async function PATCH(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    
    if (status !== "delivered" && status !== "released") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    
    const updatedEscrow = updateEscrowStatus(params.code, status, {
      payout_method: body.payout_method,
      paypal_batch_id: body.paypal_batch_id,
      freelancer_paypal_email: body.freelancer_paypal_email,
    });
    
    if (!updatedEscrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedEscrow);
  } catch (error) {
    console.error("Error updating escrow:", error);
    return NextResponse.json({ error: "Failed to update escrow" }, { status: 500 });
  }
}
