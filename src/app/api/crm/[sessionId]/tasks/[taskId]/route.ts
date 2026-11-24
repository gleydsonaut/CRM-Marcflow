import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessSession } from "@/lib/api-auth";
import { crmFail, crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string; taskId: string }> };

const updateSchema = z.object({
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
    status: z.enum(["OPEN", "DONE", "CANCELED"]).optional(),
    dueAt: z.coerce.date().nullable().optional(),
    assigneeId: z.string().min(1).optional(),
});

const taskInclude = { assignee: { select: { id: true, name: true, email: true } }, deal: { select: { id: true, title: true } } } as const;

export async function PATCH(request: NextRequest, { params }: Params) {
    const { sessionId, taskId } = await params;
    const context = await resolveCrmSession(request, sessionId, "CRM", "UPDATE");
    if (context instanceof Response) return context;
    const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Dados da tarefa inválidos");
    const task = await prisma.crmTask.findFirst({ where: { id: taskId, sessionId: context.session.id }, select: { id: true, assigneeId: true } });
    if (!task) return crmFail("Tarefa não encontrada", 404);
    if (context.user.role === "STAFF" && task.assigneeId !== context.user.id) return crmFail("Você não tem acesso a esta tarefa", 403);

    const data = parsed.data;
    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
        if (context.user.role === "STAFF") return crmFail("Você não pode reatribuir tarefas", 403);
        const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId }, select: { id: true, role: true } });
        if (!assignee || !(await canAccessSession(assignee.id, assignee.role, context.session.id))) return crmFail("Responsável sem acesso a esta sessão", 400);
    }
    const updated = await prisma.crmTask.update({
        where: { id: task.id },
        data: { ...data, ...(data.status ? { completedAt: data.status === "DONE" ? new Date() : null } : {}) },
        include: taskInclude,
    });
    return crmOk(updated, "Tarefa atualizada");
}
