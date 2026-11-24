"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { GraduationCap, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Student = { id: string; name: string; email?: string | null; phone?: string | null; city?: string | null; state?: string | null; status: string; purchases: { id: string; status: string; grossCents: number; product?: { name: string } | null }[] };
type Data = { students: Student[]; summary: { active: number; payments: number; grossCents: number; feeCents: number; netCents: number } };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function StudentsPage() {
    const [data, setData] = useState<Data | null>(null);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", state: "" });
    const load = useCallback(async () => {
        const response = await fetch(`/api/students?q=${encodeURIComponent(query)}`);
        const json = await response.json();
        if (response.ok) setData(json.data); else toast.error(json.error || "Não foi possível carregar alunos");
    }, [query]);
    useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
    const submit = async (event: FormEvent) => {
        event.preventDefault(); setSaving(true);
        try {
            const response = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, email: form.email || null, phone: form.phone || null, city: form.city || null, state: form.state || null }) });
            const json = await response.json(); if (!response.ok) throw new Error(json.error);
            toast.success("Aluno criado"); setOpen(false); setForm({ name: "", email: "", phone: "", city: "", state: "" }); load();
        } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar aluno"); } finally { setSaving(false); }
    };
    return <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-sm text-primary"><GraduationCap className="h-4 w-4" /> Gestão de alunos</div><h1 className="mt-1 text-2xl font-semibold tracking-tight">Alunos e compras</h1><p className="mt-1 text-sm text-muted-foreground">Cadastre clientes e acompanhe o histórico de pagamentos sincronizado pelas plataformas.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo aluno</Button></DialogTrigger><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Novo aluno</DialogTitle></DialogHeader><div className="space-y-3 py-5"><Field label="Nome" value={form.name} onChange={value => setForm({ ...form, name: value })} required /><Field label="E-mail" type="email" value={form.email} onChange={value => setForm({ ...form, email: value })} /><Field label="Telefone" value={form.phone} onChange={value => setForm({ ...form, phone: value })} /><div className="grid grid-cols-2 gap-3"><Field label="Cidade" value={form.city} onChange={value => setForm({ ...form, city: value })} /><Field label="UF" value={form.state} onChange={value => setForm({ ...form, state: value.toUpperCase() })} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={saving || !form.name.trim()}>{saving ? "Salvando…" : "Criar aluno"}</Button></DialogFooter></form></DialogContent></Dialog></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Alunos ativos" value={String(data?.summary.active ?? 0)} /><Metric label="Recebido" value={money.format((data?.summary.grossCents ?? 0) / 100)} /><Metric label="Taxas" value={money.format((data?.summary.feeCents ?? 0) / 100)} /><Metric label="Líquido" value={money.format((data?.summary.netCents ?? 0) / 100)} /></div>
        <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" /></div><div className="mt-4 divide-y">{!data ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p> : data.students.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</p> : data.students.map(student => <div key={student.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{[student.email, student.phone, [student.city, student.state].filter(Boolean).join("/")].filter(Boolean).join(" · ") || "Sem dados de contato"}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{student.status}</Badge>{student.purchases.map(purchase => <Badge key={purchase.id} variant="outline">{purchase.product?.name || "Compra"} · {money.format(purchase.grossCents / 100)}</Badge>)}</div></div>)}</div></CardContent></Card>
    </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></CardContent></Card>; }
function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <div className="space-y-1.5"><Label>{label}</Label><Input type={type} value={value} onChange={event => onChange(event.target.value)} required={required} /></div>; }
