"use client";

import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { useSidebar } from "./sidebar-context";
import { LogOut, PanelLeftClose, PanelLeft, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/brand/marcflow-logo";

interface SidebarShellProps {
    appName: string;
    logoUrl?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    version: string;
}

export function SidebarShell({ appName, logoUrl, userName, userEmail, version }: SidebarShellProps) {
    const { isCollapsed, toggleCollapse } = useSidebar();
    const initial = userName?.charAt(0)?.toUpperCase() || "U";

    return (
        <aside
            className={`
                hidden md:flex flex-col h-full sticky left-0 top-0 z-20
                bg-sidebar text-sidebar-foreground border-r border-sidebar-border
                transition-all duration-300 ease-in-out
                ${isCollapsed ? "w-[76px]" : "w-[286px]"}
            `}
        >
            {/* Logo / Brand */}
            <div className={`group relative flex items-center transition-all duration-300 ${isCollapsed ? "justify-center px-3 py-6" : "gap-3 px-6 py-6"}`}>
                <BrandLogo logoUrl={logoUrl} className="h-11 w-11 shrink-0" />
                {!isCollapsed && (
                    <div className="min-w-0">
                        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-sidebar-foreground">{appName}</h1>
                    </div>
                )}
                <button
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                    className={`absolute rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover:opacity-100 focus:opacity-100 ${isCollapsed ? "-right-0 top-1" : "right-3 top-3"}`}
                >
                    {isCollapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
                </button>
            </div>

            {/* Navigation */}
            <SidebarNav />

            {/* User Footer */}
            <div suppressHydrationWarning={true} className={`border-t border-sidebar-border ${isCollapsed ? "p-2" : "px-5 pt-4 pb-3"}`}>
                {isCollapsed ? (
                    <div suppressHydrationWarning={true} className="flex flex-col items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">{initial}</div>
                        <button onClick={() => signOut({ callbackUrl: "/auth/login" })} title="Sair"
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            <LogOut size={17} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div suppressHydrationWarning={true} className="flex items-center gap-3 pb-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-base font-bold text-sidebar-primary-foreground">{initial}</div>
                            <div suppressHydrationWarning={true} className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-sidebar-foreground">{userName || "Usuário"}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                            </div>
                            <Link href="/dashboard/settings" title="Configurações" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                <Settings size={18} />
                            </Link>
                        </div>
                        <div className="border-t border-sidebar-border pt-2">
                            <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[15px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                <LogOut size={18} /> Sair
                            </button>
                        </div>
                        <p className="sr-only">v{version}</p>
                    </>
                )}
            </div>
        </aside>
    );
}
