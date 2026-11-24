"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/components/chat/socket-context";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
