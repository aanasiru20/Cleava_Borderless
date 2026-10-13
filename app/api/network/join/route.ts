import { NextResponse } from "next/server";
import { createVendor } from "@/lib/network-db";

export async function POST(request: Request) {
  try {
    const { user_id, network_code, business_name, category } = await request.json();
    
    if (!user_id || !network_code || !business_name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newVendor = createVendor(user_id, network_code, business_name, category);
    
    return NextResponse.json(newVendor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to join network" }, { status: 500 });
  }
}
