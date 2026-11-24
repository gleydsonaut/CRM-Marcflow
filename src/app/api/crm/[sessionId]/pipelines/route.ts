import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crmFail, crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string }> };

const pipelineSchema = z.object({
    name: z.string().trim().min(2).max(100),
    stages: z.array(z.object({
        name: z.string().trim().min(1).max(80),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        isClosed: z.boolean().optional(),
        terminalStatus: z.enum(["WON", "LOST"]).optional(),
    })).min(1).max(20).optional(),
});

const defaultStages = [
    { name: "Lead", color: "#64748B" },
    { name: "Qualificado", color: "#3B82F6" },
    { name: "Proposta enviada", color: "#F59E0B" },
    { name: "Fechado", color: "#16A34A", isClosed: true, terminalStatus: "WON" as const },
    { name: "Perdido", color: "#DC2626", isClosed: true, terminalStatus: "LOST" as const },
];

export async function GET(request: NextRequest, { params }: Params) {
    const { sessionId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM");
    if (context instanceof Response) return context;

    const pipelines = await prisma.crmPipeline.findMany({
        where: { sessionId: context.session.id },
        orderBy: { createdAt: "asc" },
        include: {
            stages: {
                orderBy: { position: "asc" },
                include: {
                    deals: {
                        orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
                        include: {
                            contact: { select: { id: true, name: true, notify: true, jid: true } },
                            product: { select: { id: true, name: true } },
                            assignee: { select: { id: true, name: true, email: true, profile: { select: { initials: true, avatarColor: true } } } },
                        }
                    }
                }
            }
        }
    });
    return crmOk(pipelines);
}

export async function POST(request: NextRequest, { params }: Params) {
    const { sessionId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM", "CREATE");
    if (context instanceof Response) return context;

    const parsed = pipelineSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Dados do funil inválidos");
    const stages = parsed.data.stages ?? defaultStages;

    const pipeline = await prisma.crmPipeline.create({
        data: {
            sessionId: context.session.id,
            name: parsed.data.name,
            stages: {
                create: stages.map((stage, position) => ({ ...stage, position }))
            }
        },
        include: { stages: { orderBy: { position: "asc" } } }
    });
    return crmOk(pipeline, "Funil criado", 201);
}
