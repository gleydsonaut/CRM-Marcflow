import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessSession, getAuthenticatedUser, hasPermission } from "@/lib/api-auth";

type Params = { params: Promise<{ sessionId: string }> };

const importedContactSchema = z.object({
    name: z.string().trim().max(160).optional().nullable(),
    phone: z.string().trim().min(6).max(40),
    email: z.preprocess(value => value === "" ? undefined : value, z.string().trim().email().max(254).optional().nullable()),
    city: z.preprocess(value => value === "" ? undefined : value, z.string().trim().max(120).optional().nullable()),
    profession: z.preprocess(value => value === "" ? undefined : value, z.string().trim().max(120).optional().nullable()),
    productInterest: z.preprocess(value => value === "" ? undefined : value, z.string().trim().max(160).optional().nullable()),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});

const bodySchema = z.object({ contacts: z.array(importedContactSchema).min(1).max(500) });

function toPhoneJid(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return null;
    return `${digits}@s.whatsapp.net`;
}

export async function POST(request: NextRequest, { params }: Params) {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ status: false, error: "Não autenticado" }, { status: 401 });
    if (!(await hasPermission(user, "CONTACTS", "CREATE"))) return NextResponse.json({ status: false, error: "Sem permissão para importar contatos" }, { status: 403 });

    const { sessionId } = await params;
    if (!(await canAccessSession(user.id, user.role, sessionId))) return NextResponse.json({ status: false, error: "Sem acesso a esta sessão" }, { status: 403 });

    const session = await prisma.session.findUnique({ where: { sessionId }, select: { id: true } });
    if (!session) return NextResponse.json({ status: false, error: "Sessão não encontrada" }, { status: 404 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ status: false, error: "Arquivo inválido. Informe nome e telefone em até 500 linhas." }, { status: 400 });

    let created = 0;
    let updated = 0;
    const skipped: Array<{ row: number; reason: string }> = [];

    for (const [index, item] of parsed.data.contacts.entries()) {
        const jid = toPhoneJid(item.phone);
        if (!jid) {
            skipped.push({ row: index + 1, reason: "Telefone inválido" });
            continue;
        }

        const data = {
            email: item.email || undefined,
            city: item.city || undefined,
            profession: item.profession || undefined,
            productInterest: item.productInterest || undefined,
            tags: item.tags || undefined,
            importedAt: new Date().toISOString(),
        };
        const existing = await prisma.contact.findUnique({ where: { sessionId_jid: { sessionId: session.id, jid } }, select: { id: true, data: true } });
        const mergedData = { ...((existing?.data as Record<string, unknown>) || {}), ...data };
        if (existing) {
            await prisma.contact.update({ where: { id: existing.id }, data: { name: item.name || undefined, remoteJidAlt: jid, data: mergedData } });
            updated++;
        } else {
            await prisma.contact.create({ data: { sessionId: session.id, jid, remoteJidAlt: jid, name: item.name || null, data: mergedData } });
            created++;
        }
    }

    return NextResponse.json({ status: true, message: "Importação concluída", data: { created, updated, skipped } }, { status: 201 });
}
