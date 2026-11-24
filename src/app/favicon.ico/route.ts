import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    let configuredUrl = "/favicon.svg";

    try {
        const config = await prisma.systemConfig.findUnique({
            where: { id: "default" },
            select: { faviconUrl: true },
        });
        if (config?.faviconUrl) configuredUrl = config.faviconUrl;
    } catch {
        // The built-in favicon remains available while the database is starting.
    }

    let target: URL;
    try {
        target = new URL(configuredUrl, request.nextUrl.origin);
        if (target.protocol !== "http:" && target.protocol !== "https:") throw new Error("Invalid protocol");
    } catch {
        target = new URL("/favicon.svg", request.nextUrl.origin);
    }

    return NextResponse.redirect(target, {
        status: 307,
        headers: { "Cache-Control": "no-store, max-age=0" },
    });
}
