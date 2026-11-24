import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const { sessionId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM");
    if (context instanceof Response) return context;
    const sessionDbId = context.session.id;
    const [open, won, queueCounts, recentDeals] = await Promise.all([
        prisma.crmDeal.aggregate({ where: { sessionId: sessionDbId, status: "OPEN" }, _sum: { valueCents: true }, _count: true }),
        prisma.crmDeal.aggregate({ where: { sessionId: sessionDbId, status: "WON" }, _sum: { valueCents: true }, _count: true }),
        prisma.crmConversation.groupBy({ by: ["status"], where: { sessionId: sessionDbId }, _count: true }),
        prisma.crmDeal.findMany({ where: { sessionId: sessionDbId }, take: 5, orderBy: { updatedAt: "desc" }, include: { stage: { select: { name: true, color: true } }, contact: { select: { name: true, notify: true } } } }),
    ]);
    const totalFinished = won._count + await prisma.crmDeal.count({ where: { sessionId: sessionDbId, status: "LOST" } });
    return crmOk({
        open: { count: open._count, valueCents: open._sum.valueCents ?? 0 },
        won: { count: won._count, valueCents: won._sum.valueCents ?? 0 },
        conversionRate: totalFinished ? Math.round((won._count / totalFinished) * 10000) / 100 : 0,
        conversations: Object.fromEntries(queueCounts.map(item => [item.status, item._count])),
        recentDeals,
    });
}
