import path from "node:path";
import { prisma } from "./prisma";
import { canAccessSession } from "./api-auth";

export async function canAccessMediaFile(user: { id: string; role: string }, filename: string) {
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) return false;
    if (user.role === "SUPERADMIN") return true;

    const candidates = await prisma.message.findMany({
        where: { mediaUrl: { endsWith: filename } },
        select: { mediaUrl: true, sessionId: true },
    });
    for (const message of candidates) {
        if (!message.mediaUrl || path.basename(message.mediaUrl) !== filename) continue;
        if (await canAccessSession(user.id, user.role, message.sessionId)) return true;
    }
    return false;
}
