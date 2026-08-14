// HubSpot CRM integration — fetches support tickets.
// If HUBSPOT_USE_MOCK is true or no token is configured, returns realistic
// mock tickets so the whole app runs without a live CRM connection.

export interface CrmTicket {
  id: string;
  source: "hubspot" | "mock";
  category: string;
  company: string | null;
  subject: string;
  body: string | null;
  status: string;
  createdAt: string;
}

const HUBSPOT_API = "https://api.hubapi.com";

export function usingMock(): boolean {
  return process.env.HUBSPOT_USE_MOCK === "true" || !process.env.HUBSPOT_ACCESS_TOKEN;
}

export async function fetchTickets(limit = 50): Promise<CrmTicket[]> {
  if (usingMock()) return MOCK_TICKETS.slice(0, limit);

  const token = process.env.HUBSPOT_ACCESS_TOKEN as string;
  // HubSpot "tickets" CRM object. `hs_pipeline_stage` maps to status in real
  // setups; we surface the common properties and let the app categorize.
  const props = ["subject", "content", "hs_pipeline_stage", "createdate"].join(",");
  const url = `${HUBSPOT_API}/crm/v3/objects/tickets?limit=${limit}&properties=${props}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HubSpot error ${res.status}: ${detail}`);
  }
  const data = await res.json();
  return (data.results || []).map((r: any): CrmTicket => ({
    id: r.id,
    source: "hubspot",
    category: "uncategorized",
    company: r.properties?.company ?? null,
    subject: r.properties?.subject ?? "(no subject)",
    body: r.properties?.content ?? null,
    status: r.properties?.hs_pipeline_stage ?? "open",
    createdAt: r.properties?.createdate ?? new Date(0).toISOString(),
  }));
}

// Mirrors the shape of the prototype's seed tickets so the demo flow is intact.
export const MOCK_TICKETS: CrmTicket[] = [
  { id: "TKT-2301", source: "mock", category: "bugs", company: "StaffRight Inc.", subject: "Chrome extension not loading on Safari", body: "Client reports Chrome extension fails silently on Safari.", status: "closed", createdAt: "2026-02-28" },
  { id: "TKT-2287", source: "mock", category: "bugs", company: "TalentBridge LLC", subject: "Chrome extension not loading — blank screen", body: "Extension opens but shows blank white screen. IT admin installed it system-wide.", status: "closed", createdAt: "2026-02-25" },
  { id: "TKT-2244", source: "mock", category: "bugs", company: "PrimeStaff Co.", subject: "AI Sourcing returns 0 results consistently", body: "Every search returns zero results regardless of query.", status: "open", createdAt: "2026-02-22" },
  { id: "TKT-2290", source: "mock", category: "feature_request", company: "TalentBridge LLC", subject: "CSV export for candidate lists", body: "Hiring managers want to export candidates for offline review.", status: "open", createdAt: "2026-02-24" },
  { id: "TKT-2211", source: "mock", category: "bugs", company: "WorkForce Plus", subject: "Campaigns stuck in queue, not sending", body: "Outbound campaign has been queued for hours.", status: "open", createdAt: "2026-02-18" },
];
