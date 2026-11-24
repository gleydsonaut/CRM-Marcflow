import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessSession, getAuthenticatedUser, hasPermission } from "@/lib/api-auth";

type Params = { params: Promise<{ sessionId: string; jid: string }> };

/** Removes only MarcFlow's stored contact record. It never deletes the contact from WhatsApp. */
export async function DELETE(request: NextRequest, { params }: Params) {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ status: false, error: "Não autenticado" }, { status: 401 });
    if (!(await hasPermission(user, "CONTACTS", "DELETE"))) return NextResponse.json({ status: false, error: "Sem permissão para excluir contatos" }, { status: 403 });

    const { sessionId, jid: contactId } = await params;
    if (!(await canAccessSession(user.id, user.role, sessionId))) return NextResponse.json({ status: false, error: "Sem acesso a esta sessão" }, { status: 403 });
    const session = await prisma.session.findUnique({ where: { sessionId }, select: { id: true } });
    if (!session) return NextResponse.json({ status: false, error: "Sessão não encontrada" }, { status: 404 });

    const contact = await prisma.contact.findFirst({ where: { id: contactId, sessionId: session.id }, select: { id: true } });
    if (!contact) return NextResponse.json({ status: false, error: "Contato não encontrado" }, { status: 404 });

    await prisma.contact.delete({ where: { id: contact.id } });
    return NextResponse.json({ status: true, message: "Contato removido do MarcFlow" });
}
