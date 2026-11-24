import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getApiDocs } from "@/lib/swagger";
import { getAuthenticatedUser, isAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (process.env.API_DOCS_ENABLED === "false") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const spec = getApiDocs();
  return NextResponse.json(spec);
}
