import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveFlow } from "@/lib/flow-api";
import type { FlowGraph } from "@/modules/flows/types";
import { createFlowTransfer } from "@/modules/flows/transfer";

type P = { params: Promise<{ sessionId: string; flowId: string }> };

export async function GET(request: NextRequest, { params }: P) {
    const { sessionId, flowId } = await params;
    const access = await resolveFlow(request, sessionId, flowId);
    if (access instanceof NextResponse) return access;
    const triggers = await prisma.flowTrigger.findMany({
        where: { flowId }, select: { type: true, keyword: true, matchType: true, priority: true }, orderBy: { priority: "desc" },
    });
    const payload = createFlowTransfer(access.flow.name, access.flow.draftGraph as unknown as FlowGraph, triggers);
    const slug = access.flow.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "fluxo";
    return new Response(JSON.stringify(payload, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${slug}.marcflow.json"`,
            "Cache-Control": "private, no-store",
        },
    });
}
