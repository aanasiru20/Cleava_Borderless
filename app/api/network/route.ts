import { NextResponse } from "next/server";
import { getNetworkByCode, getVendorsByNetwork } from "@/lib/network-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || "NET-ABU01";

  try {
    const network = getNetworkByCode(code);
    if (!network) return NextResponse.json({ error: "Network not found" }, { status: 404 });

    const vendors = getVendorsByNetwork(network.id);
    return NextResponse.json({ network, vendors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch network" }, { status: 500 });
  }
}
