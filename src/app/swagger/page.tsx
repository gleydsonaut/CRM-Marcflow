import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { SwaggerViewer } from "./swagger-viewer";

export const dynamic = "force-dynamic";

export default async function ApiDocsPage() {
    if (process.env.API_DOCS_ENABLED === "false") notFound();

    const session = await auth();
    if (!session?.user) redirect("/auth/login?callbackUrl=/swagger");
    if (session.user.role !== "SUPERADMIN") notFound();

    return <SwaggerViewer />;
}
