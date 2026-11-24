import { Server } from "socket.io";
import { logger } from "../lib/logger";
import { getToken } from "next-auth/jwt";
import { prisma } from "../lib/prisma";

export function setupSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const secret = process.env.AUTH_SECRET;
      if (!secret) return next(new Error("Unauthorized"));
      const cookieRequest = { headers: { cookie: socket.request.headers.cookie ?? "" } };
      const token = await getToken({ req: cookieRequest, secret, cookieName: "authjs.session-token" })
        ?? await getToken({ req: cookieRequest, secret, cookieName: "__Secure-authjs.session-token" });
      const userId = typeof token?.id === "string" ? token.id : null;
      if (!userId) return next(new Error("Unauthorized"));
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
      if (!user) return next(new Error("Unauthorized"));
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    logger.info("Socket", "Client connected:", socket.id);
    const user = socket.data.user as { id: string; role: string };
    socket.join(`user:${user.id}`);

    // The sessions overview listens for updates without explicitly joining rooms.
    const sessions = await prisma.session.findMany({
      where: user.role === "SUPERADMIN" ? {} : {
        OR: [{ userId: user.id }, { sessionAccesses: { some: { userId: user.id } } }]
      },
      select: { sessionId: true }
    }).catch(() => []);
    for (const session of sessions) socket.join(session.sessionId);

    socket.on("disconnect", () => {
      logger.info("Socket", "Client disconnected:", socket.id);
    });

    // Handle joining room for specific WA session
    socket.on("join-session", async (sessionId: unknown) => {
        if (typeof sessionId !== "string" || sessionId.length > 200) return;
        const session = await prisma.session.findFirst({
          where: {
            AND: [
              { OR: [{ id: sessionId }, { sessionId }] },
              ...(user.role === "SUPERADMIN" ? [] : [{ OR: [{ userId: user.id }, { sessionAccesses: { some: { userId: user.id } } }] }]),
            ]
          }, select: { sessionId: true }
        });
        if (session) socket.join(session.sessionId);
    });

    // Handle joining user-specific room for notifications
    socket.on("join-user-room", (userId: string) => {
        if (userId === user.id) socket.join(`user:${user.id}`);
    });
  });
}
