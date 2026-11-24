import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, hasPermission } from "@/lib/api-auth";
import { crmFail, crmOk } from "@/lib/crm-api";

const studentSchema = z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().email().optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    city: z.string().trim().max(120).optional().nullable(),
    state: z.string().trim().max(2).optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "DELINQUENT", "CANCELED", "REFUNDED"]).optional(),
});

async function authorize(request: NextRequest, action: "VIEW" | "CREATE") {
    const user = await getAuthenticatedUser(request);
    if (!user) return crmFail("Não autenticado", 401);
    if (!(await hasPermission(user, "STUDENTS", action))) return crmFail("Você não tem permissão para alunos", 403);
    return user;
}

export async function GET(request: NextRequest) {
    const user = await authorize(request, "VIEW");
    if (user instanceof Response) return user;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const take = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 25)));
    const where = query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }, { phone: { contains: query } }] } : {};
    const [students, total, active, finance] = await Promise.all([
        prisma.student.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * take, take, include: { purchases: { include: { product: { select: { name: true } } }, orderBy: { purchasedAt: "desc" }, take: 3 } } }),
        prisma.student.count({ where }),
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.purchase.aggregate({ where: { status: { in: ["PAID", "ACTIVE"] } }, _sum: { grossCents: true, feeCents: true, netCents: true }, _count: true }),
    ]);
    return crmOk({ students, meta: { total, page, totalPages: Math.max(1, Math.ceil(total / take)) }, summary: { active, payments: finance._count, grossCents: finance._sum.grossCents ?? 0, feeCents: finance._sum.feeCents ?? 0, netCents: finance._sum.netCents ?? 0 } });
}

export async function POST(request: NextRequest) {
    const user = await authorize(request, "CREATE");
    if (user instanceof Response) return user;
    const parsed = studentSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return crmFail("Dados do aluno inválidos");
    const student = await prisma.student.create({ data: parsed.data });
    return crmOk(student, "Aluno criado", 201);
}
