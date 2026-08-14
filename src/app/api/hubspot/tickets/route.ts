// GET /api/hubspot/tickets — pull support tickets from HubSpot (or mock).
import { NextRequest, NextResponse } from "next/server";
import { fetchTickets, usingMock } from "@/lib/hubspot";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;
    const tickets = await fetchTickets(limit);
    return NextResponse.json({ mock: usingMock(), count: tickets.length, tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "HubSpot fetch failed" }, { status: 502 });
  }
}
