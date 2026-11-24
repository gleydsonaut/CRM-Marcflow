import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crmFail, crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string; dealId: string }> };
const updateSchema = z.object({
    stageId: z.string().min(1).optional(),
    title: z.string().trim().min(2).max(160).optional(),
    valueCents: z.coerce.number().int().min(0).optional(),
    productId: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    leadSource: z.string().trim().max(100).nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    lostReason: z.string().max(2000).nullable().optional(),
    expectedCloseAt: z.coerce.date().nullable().optional(),
    position: z.coerce.number().int().min(0).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
    const { sessionId, dealId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM", "UPDATE");
    if (context instanceof Response) return context;
    const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Dados da oportunidade inválidos");

    const current = await prisma.crmDeal.findFirst({ where: { id: dealId, sessionId: context.session.id } });
    if (!current) return crmFail("Oportunidade não encontrada", 404);
    const data = parsed.data;
    let terminalStatus = current.status;
    let stageId = current.stageId;
    if (data.stageId && data.stageId !== current.stageId) {
        const stage = await prisma.crmStage.findFirst({ where: { id: data.stageId, pipelineId: current.pipelineId } });
        if (!stage) return crmFail("Etapa inválida", 400);
        stageId = stage.id;
        terminalStatus = stage.terminalStatus ?? "OPEN";
    }
    const now = new Date();
    const deal = await prisma.crmDeal.update({
        where: { id: current.id },
        data: {
            ...data,
            stageId,
            status: terminalStatus,
            wonAt: terminalStatus === "WON" ? (current.wonAt ?? now) : null,
            lostAt: terminalStatus === "LOST" ? (current.lostAt ?? now) : null,
        },
        include: { stage: true, contact: true, product: true, assignee: { select: { id: true, name: true, email: true } } }
    });
    return crmOk(deal, "Oportunidade atualizada");
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const { sessionId, dealId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM", "DELETE");
    if (context instanceof Response) return context;
    const deal = await prisma.crmDeal.findFirst({ where: { id: dealId, sessionId: context.session.id }, select: { id: true } });
    if (!deal) return crmFail("Oportunidade não encontrada", 404);
    await prisma.crmDeal.delete({ where: { id: deal.id } });
    return crmOk(null, "Oportunidade excluída");
}
