import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { error: "O cadastro público está desativado. Solicite acesso a um administrador." },
        { status: 403 }
    );
}
