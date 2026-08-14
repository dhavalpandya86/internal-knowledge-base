// Seeds the database with demo users, tickets, clusters, and RFP entries so a
// fresh self-host has something to explore. Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { MOCK_TICKETS } from "../src/lib/hubspot";

const prisma = new PrismaClient();

const USERS = [
  { email: "kapil@company.local", name: "Kapil Sharma", role: "CS Manager" },
  { email: "julie@company.local", name: "Julie Semler", role: "VP Product Enablement" },
  { email: "josiah@company.local", name: "Josiah Johnson", role: "CS & Training" },
  { email: "dhaval@company.local", name: "Dhaval Pandya", role: "RevOps" },
];

const RFP = [
  {
    category: "Security",
    question: "How is customer data protected at rest and in transit?",
    answer:
      "All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). This deployment is self-hosted, so data never leaves your infrastructure.",
  },
  {
    category: "AI",
    question: "Which AI models power the platform and can we bring our own keys?",
    answer:
      "The platform is provider-agnostic and supports Anthropic Claude, OpenAI, and Google Gemini. Bring your own API keys; all calls are proxied server-side.",
  },
];

async function main() {
  for (const u of USERS) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }

  for (const t of MOCK_TICKETS) {
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        source: "mock",
        category: t.category,
        company: t.company,
        subject: t.subject,
        body: t.body,
        status: t.status,
        createdAt: new Date(t.createdAt),
      },
    });
  }

  const cluster = await prisma.cluster.create({
    data: {
      title: "Chrome Extension — Blank Screen / Not Loading",
      category: "bugs",
      rootCause: "Admin-installed extensions conflict with user-level permissions.",
      frequency: 3,
      trend: "up",
      kbExists: false,
    },
  });
  await prisma.ticket.updateMany({
    where: { id: { in: ["TKT-2287", "TKT-2301"] } },
    data: { clusterId: cluster.id },
  });

  for (const r of RFP) {
    await prisma.rfpEntry.create({ data: r });
  }

  console.log("Seed complete:", {
    users: USERS.length,
    tickets: MOCK_TICKETS.length,
    clusters: 1,
    rfp: RFP.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
