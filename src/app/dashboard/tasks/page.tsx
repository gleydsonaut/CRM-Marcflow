"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, Clock3, Plus } from "lucide-react";
import { toast } from "sonner";
import { SessionGuard } from "@/components/dashboard/session-guard";
import { useSession } from "@/components/dashboard/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Task = {
    id: string; title: string; description?: string | null; priority: "LOW" | "NORMAL" | "HIGH"; status: "OPEN" | "DONE" | "CANCELED"; dueAt?: string | null;
    assignee: { name?: string | null; email: string }; deal?: { title: string } | null;
};
const priorities = { LOW: "Baixa", NORMAL: "Normal", HIGH: "Alta" };
const priorityTone = { LOW: "bg-slate-500/10 text-slate-600", NORMAL: "bg-primary/10 text-primary", HIGH: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };

export default function TasksPage() { return <SessionGuard><TasksBoard /></SessionGuard>; }

function TasksBoard() {
    const { sessionId } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", priority: "NORMAL", dueAt: "" });
    const today = new Date().toISOString().slice(0, 10);

    const load = useCallback(async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/crm/${sessionId}/tasks`);
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível carregar os próximos passos");
            setTasks(json.data || []);
        } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar tarefas"); }
        finally { setLoading(false); }
    }, [sessionId]);
    useEffect(() => {
        const timeoutId = window.setTimeout(load, 0);
        return () => window.clearTimeout(timeoutId);
    }, [load]);

    const metrics = useMemo(() => ({
        overdue: tasks.filter(task => task.dueAt && task.dueAt.slice(0, 10) < today).length,
        today: tasks.filter(task => task.dueAt?.slice(0, 10) === today).length,
    }), [tasks, today]);

    const create = async () => {
        if (!sessionId || !form.title.trim()) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/crm/${sessionId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, dueAt: form.dueAt || null }) });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível criar o próximo passo");
            setForm({ title: "", description: "", priority: "NORMAL", dueAt: "" }); setOpen(false); toast.success("Próximo passo criado"); await load();
        } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao criar tarefa"); }
        finally { setSaving(false); }
    };

    const finish = async (taskId: string) => {
        if (!sessionId) return;
        try {
            const response = await fetch(`/api/crm/${sessionId}/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "DONE" }) });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível concluir a tarefa");
            toast.success("Tarefa concluída"); await load();
        } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao concluir tarefa"); }
    };

    if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando próximos passos…</div>;
    return <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-sm text-primary"><CalendarCheck2 className="h-4 w-4" /> Operação</div><h1 className="mt-1 text-2xl font-semibold tracking-tight">Próximos passos</h1><p className="mt-1 text-sm text-muted-foreground">Organize retornos, entregas e SLAs da carteira sem perder o timing.</p></div>
            <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo próximo passo</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo próximo passo</DialogTitle><DialogDescription>Crie uma ação clara e defina quando ela deve acontecer.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="task-title">Ação</Label><Input id="task-title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Retornar com proposta revisada" /></div><div className="space-y-2"><Label htmlFor="task-description">Contexto</Label><Textarea id="task-description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="O que precisa ser considerado?" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="task-due">Prazo / SLA</Label><Input id="task-due" type="date" value={form.dueAt} onChange={event => setForm({ ...form, dueAt: event.target.value })} /></div><div className="space-y-2"><Label>Prioridade</Label><Select value={form.priority} onValueChange={priority => setForm({ ...form, priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorities).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create} disabled={saving || !form.title.trim()}>{saving ? "Salvando…" : "Criar próximo passo"}</Button></DialogFooter></DialogContent></Dialog>
        </div>
        <div className="grid gap-3 sm:grid-cols-3"><Metric icon={Clock3} label="Abertas" value={String(tasks.length)} detail="ações em andamento" /><Metric icon={CalendarCheck2} label="Para hoje" value={String(metrics.today)} detail="priorize estes retornos" /><Metric icon={CheckCircle2} label="SLA vencido" value={String(metrics.overdue)} detail={metrics.overdue ? "precisa de atenção" : "nenhum atraso"} tone={metrics.overdue ? "text-destructive" : "text-emerald-600"} /></div>
        <div className="space-y-2">{tasks.length === 0 ? <Card><CardContent className="py-12 text-center"><CalendarCheck2 className="mx-auto mb-3 h-8 w-8 text-primary" /><h2 className="font-medium">Nenhum próximo passo aberto</h2><p className="mt-1 text-sm text-muted-foreground">Crie uma ação para começar a acompanhar seus retornos e SLAs.</p></CardContent></Card> : tasks.map(task => <Card key={task.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{task.title}</p><Badge variant="secondary" className={priorityTone[task.priority]}>{priorities[task.priority]}</Badge></div>{task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}<p className="mt-2 text-xs text-muted-foreground">{task.dueAt ? `Prazo: ${new Date(`${task.dueAt.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}{task.deal ? ` · ${task.deal.title}` : ""} · {task.assignee.name || task.assignee.email}</p></div><Button variant="outline" size="sm" onClick={() => finish(task.id)}><CheckCircle2 className="mr-2 h-4 w-4" /> Concluir</Button></CardContent></Card>)}</div>
    </div>;
}

function Metric({ icon: Icon, label, value, detail, tone = "text-primary" }: { icon: typeof Clock3; label: string; value: string; detail: string; tone?: string }) { return <Card><CardContent className="flex items-start gap-3 p-4"><div className={`rounded-lg bg-muted p-2 ${tone}`}><Icon className="h-4 w-4" /></div><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>; }
