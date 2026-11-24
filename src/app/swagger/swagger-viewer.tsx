"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export function SwaggerViewer() {
    return (
        <div className="min-h-screen bg-white">
            <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold">Documentação da API do MarcFlow</h1>
                    <p className="mt-1 text-sm text-blue-100">Acesso administrativo autenticado</p>
                </div>
            </header>
            <main className="container mx-auto">
                <SwaggerUI url="/api/docs" />
            </main>
        </div>
    );
}
