import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { normalizeBrandImageUrl } from "@/lib/brand-url";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const config = await prisma.systemConfig.findUnique({
            where: { id: "default" }
        });

        return NextResponse.json({ status: true, message: "System config fetched", data: config || { appName: "MarcFlow", faviconUrl: "/favicon.svg", timezone: "America/Sao_Paulo" } });
    } catch (error) {
        return NextResponse.json({ status: false, message: "Failed to fetch settings", error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // @ts-ignore
        const user = await getAuthenticatedUser(req);
        if (!user || user.role !== "SUPERADMIN") {
            return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { appName, logoUrl, faviconUrl, timezone } = body;
        const normalizedLogoUrl = await normalizeBrandImageUrl(logoUrl);
        const normalizedFaviconUrl = await normalizeBrandImageUrl(faviconUrl);

        // @ts-ignore
        const config = await prisma.systemConfig.upsert({
            where: { id: "default" },
            update: { appName, logoUrl: normalizedLogoUrl, faviconUrl: normalizedFaviconUrl || "/favicon.svg", timezone, enableRegistration: false },
            create: { id: "default", appName, logoUrl: normalizedLogoUrl, faviconUrl: normalizedFaviconUrl || "/favicon.svg", timezone: timezone || "America/Sao_Paulo", enableRegistration: false }
        });

        return NextResponse.json({ status: true, message: "System settings updated", data: config });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao atualizar as configurações";
        return NextResponse.json({ status: false, message, error: message }, { status: 400 });
    }
}
