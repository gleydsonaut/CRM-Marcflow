import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crmFail, crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string }> };

const dealSchema = z.object({
    pipelineId: z.string().min(1),
    stageId: z.string().min(1),
    title: z.string().trim().min(2).max(160),
    valueCents: z.coerce.number().int().min(0).optional(),
    contactId: z.string().optional().nullable(),
    contactJid: z.string().max(120).optional().nullable(),
    productId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    leadSource: z.string().trim().max(100).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    expectedCloseAt: z.coerce.date().optional().nullable(),
});

export async function POST(request: NextRequest, { params }: Params) {
    const { sessionId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM", "CREATE");
    if (context instanceof Response) return context;
    const parsed = dealSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Dados da oportunidade inválidos");

    const data = parsed.data;
    const stage = await prisma.crmStage.findFirst({
        where: { id: data.stageId, pipelineId: data.pipelineId, pipeline: { sessionId: context.session.id } },
        select: { id: true, terminalStatus: true }
    });
    if (!stage) return crmFail("Etapa do funil inválida", 404);

    if (data.contactId) {
        const contact = await prisma.contact.findFirst({ where: { id: data.contactId, sessionId: context.session.id }, select: { id: true, jid: true } });
        if (!contact) return crmFail("Contato não pertence à sessão", 400);
        data.contactJid = data.contactJid ?? contact.jid;
    }
    if (data.productId) {
        const product = await prisma.product.findFirst({ where: { id: data.productId, sessionId: context.session.id }, select: { id: true } });
        if (!product) return crmFail("Produto não pertence à sessão", 400);
    }

    const last = await prisma.crmDeal.aggregate({ where: { stageId: stage.id }, _max: { position: true } });
    const status = stage.terminalStatus ?? "OPEN";
    const now = new Date();
    const deal = await prisma.crmDeal.create({
        data: {
            ...data,
            sessionId: context.session.id,
            position: (last._max.position ?? -1) + 1,
            status,
            wonAt: status === "WON" ? now : null,
            lostAt: status === "LOST" ? now : null,
        },
        include: { stage: true, contact: true, product: true, assignee: { select: { id: true, name: true, email: true } } }
    });
    return crmOk(deal, "Oportunidade criada", 201);
}
