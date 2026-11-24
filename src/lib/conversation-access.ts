import { prisma } from "@/lib/prisma";

/**
 * Conversation privacy is stricter than session access: administrators can
 * supervise the whole inbox, while every other account only sees conversations
 * explicitly assigned to it.
 */
export function canSuperviseConversations(role: string) {
    return role === "SUPERADMIN";
}

export async function canAccessConversation(
    user: { id: string; role: string },
    dbSessionId: string,
    jid: string
) {
    if (canSuperviseConversations(user.role)) return true;

    const conversation = await prisma.crmConversation.findFirst({
        where: { sessionId: dbSessionId, chatJid: jid },
        select: { assigneeId: true },
    });

    return conversation?.assigneeId === user.id;
}

export async function assignedConversationJids(userId: string, dbSessionId: string) {
    const conversations = await prisma.crmConversation.findMany({
        where: { sessionId: dbSessionId, assigneeId: userId },
        select: { chatJid: true },
    });
    return conversations.map((conversation) => conversation.chatJid);
}

/** Resolves a public or database session id and applies the inbox privacy rule. */
export async function resolveAuthorizedConversationSession(
    user: { id: string; role: string },
    sessionReference: string,
    jid: string
) {
    const session = await prisma.session.findFirst({
        where: { OR: [{ id: sessionReference }, { sessionId: sessionReference }] },
        select: { id: true, sessionId: true },
    });
    if (!session) return null;
    return (await canAccessConversation(user, session.id, jid)) ? session : null;
}
