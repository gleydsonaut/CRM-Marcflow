
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateApiKey, hashApiKey } from "@/lib/api-auth";

async function main() {
    const email = "test@api.com";
    const apiKey = generateApiKey();
    const password = await bcrypt.hash(process.env.TEST_USER_PASSWORD ?? "local-test-password", 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { apiKey: hashApiKey(apiKey), role: 'SUPERADMIN' },
        create: {
            email,
            password,
            name: "Test User",
            apiKey: hashApiKey(apiKey),
            role: 'SUPERADMIN'
        }
    });

    console.log(`User ${user.email} ready. Use the generated key for this test run: ${apiKey}`);
    
    // Also ensure a session exists for testing
    const session = await prisma.session.upsert({
        where: { sessionId: "test-session" },
        update: { userId: user.id },
        create: {
            sessionId: "test-session",
            name: "Test Session",
            userId: user.id,
            status: "CONNECTED"
        }
    });
    console.log(`Session ${session.sessionId} ready.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
