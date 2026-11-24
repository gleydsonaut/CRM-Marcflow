import { NextRequest, NextResponse } from "next/server";
import type { PermissionAction, PermissionModule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessSession, getAuthenticatedUser, hasPermission } from "@/lib/api-auth";

export function crmOk<T>(data: T, message?: string, status = 200) {
    return NextResponse.json({ status: true, ...(message ? { message } : {}), data }, { status });
}

export function crmFail(error: string, status = 400) {
    return NextResponse.json({ status: false, error, message: error }, { status });
}

export async function resolveCrmSession(
    request: NextRequest,
    sessionReference: string,
    module: PermissionModule,
    action: PermissionAction = "VIEW"
) {
    const user = await getAuthenticatedUser(request);
    if (!user) return crmFail("Não autenticado", 401);

    if (!(await hasPermission(user, module, action))) {
        return crmFail("Você não tem permissão para esta ação", 403);
    }

    if (!(await canAccessSession(user.id, user.role, sessionReference))) {
        return crmFail("Você não tem acesso a esta sessão", 403);
    }

    const session = await prisma.session.findFirst({
        where: { OR: [{ id: sessionReference }, { sessionId: sessionReference }] },
        select: { id: true, sessionId: true, name: true }
    });
    if (!session) return crmFail("Sessão não encontrada", 404);

    return { user, session };
}
