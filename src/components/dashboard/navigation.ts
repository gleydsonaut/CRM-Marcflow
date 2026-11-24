import type { ElementType } from "react";
import {
    Activity, Bell, Bot, CalendarCheck2, CalendarClock, Code, DatabaseBackup, FileText,
    GraduationCap, HardDrive, KanbanSquare, LayoutDashboard, Megaphone,
    MessageCircleReply, MessageSquare, QrCode, Settings, Tag, UserCheck,
    UserCircle, UserPlus, Users, Webhook, Workflow,
} from "lucide-react";

export interface NavItem {
    href: string;
    label: string;
    icon: ElementType;
    external?: boolean;
    superadminOnly?: boolean;
    allowedRoles?: string[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const navGroups: NavGroup[] = [
    { label: "Principal", items: [
        { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
        { href: "/dashboard/sessions", label: "Sessões / QR", icon: QrCode },
    ] },
    { label: "Mensagens", items: [
        { href: "/dashboard/chat", label: "Conversas", icon: MessageSquare },
        { href: "/dashboard/broadcast", label: "Transmissão", icon: Megaphone },
        { href: "/dashboard/archive", label: "Exportar conversas", icon: DatabaseBackup },
    ] },
    { label: "Contatos", items: [
        { href: "/dashboard/contacts", label: "Contatos", icon: UserCheck },
        { href: "/dashboard/groups", label: "Grupos", icon: Users },
        { href: "/dashboard/labels", label: "Etiquetas", icon: Tag },
    ] },
    { label: "CRM", items: [
        { href: "/dashboard/crm", label: "Funil de vendas", icon: KanbanSquare },
        { href: "/dashboard/tasks", label: "Próximos passos", icon: CalendarCheck2 },
        { href: "/dashboard/students", label: "Gestão de alunos", icon: GraduationCap },
    ] },
    { label: "Automação", items: [
        { href: "/dashboard/flows", label: "Fluxos de conversa", icon: Workflow },
        { href: "/dashboard/bot-settings", label: "Configurações do bot", icon: Bot },
        { href: "/dashboard/autoreply", label: "Resposta automática", icon: MessageCircleReply },
        { href: "/dashboard/profile", label: "Perfil do bot", icon: UserCircle },
        { href: "/dashboard/scheduler", label: "Agendador", icon: CalendarClock },
        { href: "/dashboard/webhooks", label: "Webhooks & API", icon: Webhook },
    ] },
    { label: "Desenvolvedor", items: [
        { href: "/docs", label: "Documentação da API", icon: FileText },
        { href: "/swagger", label: "Swagger UI", icon: Code, external: true, superadminOnly: true },
    ] },
    { label: "Administração", items: [
        { href: "/dashboard/media", label: "Gerenciador de mídia", icon: HardDrive },
        { href: "/dashboard/sessions/access", label: "Acesso às sessões", icon: UserPlus },
        { href: "/dashboard/users", label: "Usuários", icon: Users, superadminOnly: true },
        { href: "/dashboard/settings", label: "Configurações", icon: Settings },
        { href: "/dashboard/system-monitor", label: "Monitor do sistema", icon: Activity, superadminOnly: true },
        { href: "/dashboard/notifications", label: "Notificações", icon: Bell, superadminOnly: true },
    ] },
];

export function isNavItemVisible(item: NavItem, role?: string) {
    if (item.superadminOnly && role !== "SUPERADMIN") return false;
    return !item.allowedRoles || (!!role && item.allowedRoles.includes(role));
}
