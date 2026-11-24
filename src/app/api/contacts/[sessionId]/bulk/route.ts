import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessSession, getAuthenticatedUser, hasPermission } from "@/lib/api-auth";

type Params = { params: Promise<{ sessionId: string }> };

const bodySchema = z.object({
    contactIds: z.array(z.string().cuid()).max(5000).default([]),
    allMatching: z.boolean().default(false),
    search: z.string().trim().max(160).optional().default(""),
}).refine(value => value.allMatching || value.contactIds.length > 0, { message: "Selecione ao menos um contato" });

export async function DELETE(request: NextRequest, { params }: Params) {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ status: false, error: "Não autenticado" }, { status: 401 });
    if (!(await hasPermission(user, "CONTACTS", "DELETE"))) return NextResponse.json({ status: false, error: "Sem permissão para excluir contatos" }, { status: 403 });

    const { sessionId } = await params;
    if (!(await canAccessSession(user.id, user.role, sessionId))) return NextResponse.json({ status: false, error: "Sem acesso a esta sessão" }, { status: 403 });
    const session = await prisma.session.findUnique({ where: { sessionId }, select: { id: true } });
    if (!session) return NextResponse.json({ status: false, error: "Sessão não encontrada" }, { status: 404 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ status: false, error: "Seleção de contatos inválida" }, { status: 400 });

    const { contactIds, allMatching, search } = parsed.data;
    const filter = search ? {
        OR: [
            { name: { contains: search } }, { notify: { contains: search } }, { verifiedName: { contains: search } },
            { jid: { contains: search } }, { remoteJidAlt: { contains: search } },
        ],
    } : {};
    const result = await prisma.contact.deleteMany({
        where: { sessionId: session.id, ...(allMatching ? filter : { id: { in: contactIds } }) },
    });
    return NextResponse.json({ status: true, message: `${result.count} contato(s) removido(s) do MarcFlow`, data: { deleted: result.count } });
}
