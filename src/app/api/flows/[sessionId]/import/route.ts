import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, resolveSession } from "@/lib/flow-api";
import { FLOW_TRANSFER_MAX_BYTES, parseFlowTransfer } from "@/modules/flows/transfer";

type P = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, { params }: P) {
    const { sessionId } = await params;
    const access = await resolveSession(request, sessionId);
    if (access instanceof NextResponse) return access;

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > FLOW_TRANSFER_MAX_BYTES) return fail("O arquivo JSON excede o limite de 2 MB", 413);

    let input: unknown;
    try { input = JSON.parse(raw); } catch { return fail("O arquivo não contém um JSON válido"); }

    try {
        const imported = parseFlowTransfer(input);
        const flow = await prisma.$transaction(async tx => {
            const created = await tx.flow.create({
                data: { sessionId: access.session.id, name: imported.name, draftGraph: imported.graph as object, status: "DRAFT" },
            });
            if (imported.triggers.length) {
                await tx.flowTrigger.createMany({ data: imported.triggers.map(trigger => ({ ...trigger, flowId: created.id })) });
            }
            return created;
        });
        return ok({ id: flow.id, name: flow.name, warnings: imported.warnings }, "Fluxo importado como rascunho");
    } catch (error) {
        return fail(error instanceof Error ? error.message : "Não foi possível importar o fluxo", 422);
    }
}
