import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessSession } from "@/lib/api-auth";
import { crmFail, crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string }> };

const taskSchema = z.object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
    dueAt: z.coerce.date().nullable().optional(),
    assigneeId: z.string().min(1).optional(),
    dealId: z.string().min(1).nullable().optional(),
    conversationId: z.string().min(1).nullable().optional(),
});

const taskInclude = {
    assignee: { select: { id: true, name: true, email: true } },
    deal: { select: { id: true, title: true } },
    conversation: { select: { id: true, chatJid: true, contact: { select: { name: true, notify: true } } } },
} as const;

export async function GET(request: NextRequest, { params }: Params) {
    const { sessionId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM");
    if (context instanceof Response) return context;

    const includeCompleted = request.nextUrl.searchParams.get("completed") === "true";
    const isManager = context.user.role !== "STAFF";
    const tasks = await prisma.crmTask.findMany({
        where: {
            sessionId: context.session.id,
            ...(includeCompleted ? {} : { status: "OPEN" }),
            ...(isManager ? {} : { assigneeId: context.user.id }),
        },
        include: taskInclude,
        orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    });
    return crmOk(tasks);
}

export async function POST(request: NextRequest, { params }: Params) {
    const { sessionId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM", "CREATE");
    if (context instanceof Response) return context;
    const parsed = taskSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Dados da tarefa inválidos");

    const data = parsed.data;
    const assigneeId = data.assigneeId ?? context.user.id;
    if (assigneeId !== context.user.id) {
        if (context.user.role === "STAFF") return crmFail("Você só pode atribuir tarefas a si mesmo", 403);
        const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true, role: true } });
        if (!assignee || !(await canAccessSession(assignee.id, assignee.role, context.session.id))) return crmFail("Responsável sem acesso a esta sessão", 400);
    }
    if (data.dealId && !(await prisma.crmDeal.findFirst({ where: { id: data.dealId, sessionId: context.session.id }, select: { id: true } }))) return crmFail("Oportunidade inválida", 400);
    if (data.conversationId && !(await prisma.crmConversation.findFirst({ where: { id: data.conversationId, sessionId: context.session.id }, select: { id: true } }))) return crmFail("Conversa inválida", 400);

    const task = await prisma.crmTask.create({
        data: { ...data, assigneeId, sessionId: context.session.id },
        include: taskInclude,
    });
    return crmOk(task, "Próximo passo criado", 201);
}
