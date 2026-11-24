"use client";

import { useState } from "react";

/** MarcFlow mark, inheriting the selected theme's primary color. */
export function MarcFlowLogo({ className = "h-10 w-10" }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path d="M10 37V12.5c0-1.6 2-2.3 3-1.1L24 25l11-13.6c1-1.2 3-.5 3 1.1V37"
                fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="38.5" r="4.6" fill="var(--primary)" />
        </svg>
    );
}

export function BrandLogo({ logoUrl, className = "h-10 w-10" }: { logoUrl?: string | null; className?: string }) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);

    if (!logoUrl || failedUrl === logoUrl) return <MarcFlowLogo className={className} />;

    return (
        // A plain img supports any administrator-configured HTTPS host without a build-time allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={logoUrl}
            alt="Logo do aplicativo"
            className={`${className} object-contain`}
            onError={() => setFailedUrl(logoUrl)}
        />
    );
}
