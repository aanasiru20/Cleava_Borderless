import { NextResponse } from "next/server";
import { getEscrows, createEscrow } from "@/lib/db";

// GET all escrows (for the Freelancer Dashboard)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get("freelancer_id");
    
    let escrows = getEscrows();
    
    // Optionally filter by freelancer
    if (freelancerId) {
      escrows = escrows.filter(e => e.freelancer_id === freelancerId);
    }
    
    // Sort by most recent first
    escrows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return NextResponse.json(escrows);
  } catch (error) {
    console.error("Error fetching escrows:", error);
    return NextResponse.json({ error: "Failed to fetch escrows" }, { status: 500 });
  }
}

// POST create a new escrow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.freelancer_id || !body.amount_usdt || !body.job_description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const newEscrow = createEscrow({
      freelancer_id: body.freelancer_id,
      client_name: body.client_name || null,
      client_email: body.client_email || null,
      amount_usdt: Number(body.amount_usdt),
      job_description: body.job_description,
      freelancer_paypal_email: body.freelancer_paypal_email || null,
    });
    
    return NextResponse.json(newEscrow, { status: 201 });
  } catch (error) {
    console.error("Error creating escrow:", error);
    return NextResponse.json({ error: "Failed to create escrow" }, { status: 500 });
  }
}
