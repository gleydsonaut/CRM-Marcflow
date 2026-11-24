"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/components/theme-provider";

const options: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Laptop },
];

export function ThemeToggle() {
    const [theme, setTheme] = useState<ThemePreference>("system");

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setTheme(getThemePreference()), 0);
        return () => window.clearTimeout(timeoutId);
    }, []);

    const select = (value: ThemePreference) => {
        setTheme(value);
        setThemePreference(value);
    };

    const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Alterar aparência" title="Aparência">
                    <Icon className="h-4.5 w-4.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1.5">
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Aparência</p>
                {options.map(({ value, label, icon: OptionIcon }) => (
                    <button key={value} type="button" onClick={() => select(value)}
                        className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted", theme === value && "bg-primary/10 text-primary")}>
                        <OptionIcon className="h-4 w-4" />{label}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
