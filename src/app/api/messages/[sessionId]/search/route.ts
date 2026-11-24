import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, canAccessSession } from "@/lib/api-auth";
import { assignedConversationJids, canSuperviseConversations } from "@/lib/conversation-access";

/**
 * GET /api/messages/{sessionId}/search
 * Search messages stored in database for a session
 * Query params: q, jid, type, limit, page, fromMe
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await params;
        const { searchParams } = new URL(request.url);

        const q = searchParams.get("q") || "";
        const jid = searchParams.get("jid") || undefined;
        const type = searchParams.get("type") || undefined;
        const fromMeParam = searchParams.get("fromMe");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
        const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
        const skip = (page - 1) * limit;

        if (!q && !jid) {
            return NextResponse.json({
                status: false,
                message: "At least one of 'q' (search query) or 'jid' is required",
                error: "At least one of 'q' (search query) or 'jid' is required"
            }, { status: 400 });
        }

        // Check if user can access this session
        const canAccess = await canAccessSession(user.id, user.role, sessionId);
        if (!canAccess) {
            return NextResponse.json({ status: false, message: "Forbidden - Cannot access this session", error: "Forbidden - Cannot access this session" }, { status: 403 });
        }

        // Get internal session ID
        const session = await prisma.session.findUnique({
            where: { sessionId },
            select: { id: true }
        });

        if (!session) {
            return NextResponse.json({ status: false, message: "Session not found", error: "Session not found" }, { status: 404 });
        }

        const allowedJids = canSuperviseConversations(user.role)
            ? undefined
            : await assignedConversationJids(user.id, session.id);
        const decodedJid = jid ? decodeURIComponent(jid) : undefined;
        if (decodedJid && allowedJids && !allowedJids.includes(decodedJid)) {
            return NextResponse.json({ status: false, message: "Forbidden", error: "Conversation is not assigned to this user" }, { status: 403 });
        }

        // Build search filters
        const where: any = {
            sessionId: session.id,
            ...(allowedJids ? { remoteJid: { in: allowedJids } } : {}),
        };

        if (q) {
            where.content = { contains: q };
        }

        if (decodedJid) {
            where.remoteJid = decodedJid;
        }

        if (type) {
            where.type = type.toUpperCase();
        }

        if (fromMeParam !== null && fromMeParam !== undefined) {
            where.fromMe = fromMeParam === "true";
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                orderBy: { timestamp: "desc" },
                take: limit,
                skip,
                select: {
                    id: true,
                    remoteJid: true,
                    senderJid: true,
                    fromMe: true,
                    keyId: true,
                    pushName: true,
                    type: true,
                    content: true,
                    status: true,
                    timestamp: true,
                    quoteId: true,
                    contract: {
                        select: {
                            name: true,
                            notify: true,
                            verifiedName: true,
                            profilePic: true
                        }
                    }
                }
            }),
            prisma.message.count({ where })
        ]);

        return NextResponse.json({
            status: true,
            message: "Messages successfully retrieved",
            data: messages,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Message search error:", error);
        return NextResponse.json({ status: false, message: "Failed to search messages", error: "Failed to search messages" }, { status: 500 });
    }
}
