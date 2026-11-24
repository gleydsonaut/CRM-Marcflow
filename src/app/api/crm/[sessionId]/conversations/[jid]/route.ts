import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessConversation, canSuperviseConversations } from "@/lib/conversation-access";
import { canAccessSession } from "@/lib/api-auth";
import { crmFail, crmOk, resolveCrmSession } from "@/lib/crm-api";

type Params = { params: Promise<{ sessionId: string; jid: string }> };

const assignmentSchema = z.object({ assigneeId: z.string().cuid().nullable() });

export async function GET(request: NextRequest, { params }: Params) {
    const { sessionId, jid } = await params;
    const context = await resolveCrmSession(request, sessionId, "INBOX");
    if (context instanceof Response) return context;
    const chatJid = decodeURIComponent(jid);
    if (!(await canAccessConversation(context.user, context.session.id, chatJid))) return crmFail("Você não tem acesso a esta conversa", 403);

    const conversation = await prisma.crmConversation.findUnique({
        where: { sessionId_chatJid: { sessionId: context.session.id, chatJid } },
        include: { assignee: { select: { id: true, name: true, email: true, profile: { select: { initials: true, avatarColor: true } } } } },
    });
    return crmOk(conversation);
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const { sessionId, jid } = await params;
    const context = await resolveCrmSession(request, sessionId, "INBOX", "UPDATE");
    if (context instanceof Response) return context;
    if (!canSuperviseConversations(context.user.role)) return crmFail("Somente um administrador pode atribuir conversas", 403);

    const parsed = assignmentSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Responsável inválido");
    if (parsed.data.assigneeId) {
        const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assigneeId }, select: { id: true, role: true } });
        if (!assignee) return crmFail("Usuário responsável não encontrado", 404);
        if (!(await canAccessSession(assignee.id, assignee.role, context.session.id))) {
            return crmFail("O responsável precisa ter acesso à sessão antes de receber conversas", 400);
        }
    }

    const chatJid = decodeURIComponent(jid);
    const contact = await prisma.contact.findFirst({ where: { sessionId: context.session.id, OR: [{ jid: chatJid }, { lid: chatJid }, { remoteJidAlt: chatJid }] }, select: { id: true } });
    const conversation = await prisma.crmConversation.upsert({
        where: { sessionId_chatJid: { sessionId: context.session.id, chatJid } },
        create: { sessionId: context.session.id, chatJid, contactId: contact?.id, assigneeId: parsed.data.assigneeId, status: "IN_PROGRESS" },
        update: { assigneeId: parsed.data.assigneeId, contactId: contact?.id, status: parsed.data.assigneeId ? "IN_PROGRESS" : "NEW" },
        include: { assignee: { select: { id: true, name: true, email: true, profile: { select: { initials: true, avatarColor: true } } } } },
    });
    return crmOk(conversation, parsed.data.assigneeId ? "Conversa atribuída" : "Conversa removida da fila");
}
