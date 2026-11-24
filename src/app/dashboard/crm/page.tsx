"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, KanbanSquare, Plus, Target, TrendingUp, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { SessionGuard } from "@/components/dashboard/session-guard";
import { useSession } from "@/components/dashboard/session-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Deal = {
    id: string;
    title: string;
    valueCents: number;
    status: "OPEN" | "WON" | "LOST";
    leadSource?: string | null;
    contact?: { name?: string | null; notify?: string | null } | null;
    product?: { name: string } | null;
    assignee?: { name?: string | null } | null;
};
type Stage = { id: string; name: string; color: string; isClosed: boolean; deals: Deal[] };
type Pipeline = { id: string; name: string; stages: Stage[] };

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CrmPage() {
    return <SessionGuard><CrmBoard /></SessionGuard>;
}

function CrmBoard() {
    const { sessionId } = useSession();
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingPipeline, setCreatingPipeline] = useState(false);
    const [pipelineName, setPipelineName] = useState("Comercial");
    const [newDeal, setNewDeal] = useState({ title: "", value: "", source: "" });
    const [dealDialogOpen, setDealDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/crm/${sessionId}/pipelines`);
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível carregar o funil");
            setPipelines(json.data || []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao carregar o CRM");
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => { load(); }, [load]);

    const pipeline = pipelines[0];
    const allDeals = useMemo(() => pipeline?.stages.flatMap(stage => stage.deals) ?? [], [pipeline]);
    const openValue = allDeals.filter(deal => deal.status === "OPEN").reduce((total, deal) => total + deal.valueCents, 0);
    const wonValue = allDeals.filter(deal => deal.status === "WON").reduce((total, deal) => total + deal.valueCents, 0);
    const finished = allDeals.filter(deal => deal.status !== "OPEN");
    const conversion = finished.length ? Math.round((allDeals.filter(deal => deal.status === "WON").length / finished.length) * 100) : 0;

    const createPipeline = async () => {
        if (!pipelineName.trim() || !sessionId) return;
        setCreatingPipeline(true);
        try {
            const response = await fetch(`/api/crm/${sessionId}/pipelines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: pipelineName }) });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível criar o funil");
            toast.success("Funil comercial criado");
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao criar funil");
        } finally {
            setCreatingPipeline(false);
        }
    };

    const createDeal = async () => {
        const firstStage = pipeline?.stages[0];
        if (!sessionId || !pipeline || !firstStage || !newDeal.title.trim()) return;
        setSaving(true);
        try {
            const valueCents = Math.round(Number(newDeal.value.replace(",", ".")) * 100);
            const response = await fetch(`/api/crm/${sessionId}/deals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pipelineId: pipeline.id, stageId: firstStage.id, title: newDeal.title, valueCents: Number.isFinite(valueCents) ? Math.max(valueCents, 0) : 0, leadSource: newDeal.source || null }),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível criar oportunidade");
            setNewDeal({ title: "", value: "", source: "" });
            setDealDialogOpen(false);
            toast.success("Oportunidade adicionada ao funil");
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao criar oportunidade");
        } finally {
            setSaving(false);
        }
    };

    const moveDeal = async (dealId: string, stageId: string) => {
        if (!sessionId) return;
        try {
            const response = await fetch(`/api/crm/${sessionId}/deals/${dealId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stageId }) });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível mover oportunidade");
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao mover oportunidade");
        }
    };

    if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando CRM…</div>;

    if (!pipeline) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 rounded-2xl bg-primary/10 p-4 text-primary"><KanbanSquare className="h-8 w-8" /></div>
                <h1 className="text-2xl font-semibold tracking-tight">Comece seu funil comercial</h1>
                <p className="mt-2 text-sm text-muted-foreground">Crie as etapas padrão de lead, qualificação, proposta, fechamento e perda. Você poderá personalizá-las em seguida.</p>
                <div className="mt-6 flex w-full gap-2">
                    <Input value={pipelineName} onChange={e => setPipelineName(e.target.value)} aria-label="Nome do funil" />
                    <Button onClick={createPipeline} disabled={creatingPipeline}>{creatingPipeline ? "Criando…" : "Criar funil"}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-primary"><KanbanSquare className="h-4 w-4" /> CRM</div>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pipeline.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Acompanhe oportunidades do WhatsApp do primeiro contato ao fechamento.</p>
                </div>
                <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova oportunidade</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle><DialogDescription>Ela entrará na primeira etapa do funil.</DialogDescription></DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2"><Label htmlFor="deal-title">Título</Label><Input id="deal-title" value={newDeal.title} onChange={e => setNewDeal({ ...newDeal, title: e.target.value })} placeholder="Ex.: Consultoria para João" /></div>
                            <div className="space-y-2"><Label htmlFor="deal-value">Valor estimado (R$)</Label><Input id="deal-value" inputMode="decimal" value={newDeal.value} onChange={e => setNewDeal({ ...newDeal, value: e.target.value })} placeholder="0,00" /></div>
                            <div className="space-y-2"><Label htmlFor="deal-source">Origem do lead</Label><Input id="deal-source" value={newDeal.source} onChange={e => setNewDeal({ ...newDeal, source: e.target.value })} placeholder="Ex.: Anúncio, IA ou indicação" /></div>
                        </div>
                        <DialogFooter><Button variant="outline" onClick={() => setDealDialogOpen(false)}>Cancelar</Button><Button onClick={createDeal} disabled={saving || !newDeal.title.trim()}>{saving ? "Salvando…" : "Criar oportunidade"}</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric icon={Target} label="Em aberto" value={money.format(openValue / 100)} detail={`${allDeals.filter(deal => deal.status === "OPEN").length} oportunidades`} />
                <Metric icon={CircleDollarSign} label="Fechado" value={money.format(wonValue / 100)} detail={`${allDeals.filter(deal => deal.status === "WON").length} vendas`} tone="text-emerald-600" />
                <Metric icon={TrendingUp} label="Conversão" value={`${conversion}%`} detail="entre oportunidades encerradas" tone="text-blue-600" />
                <Metric icon={UsersRound} label="No funil" value={String(allDeals.length)} detail="oportunidades cadastradas" tone="text-violet-600" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {pipeline.stages.map((stage) => (
                    <section key={stage.id} className="w-[290px] min-w-[290px] rounded-xl border bg-muted/20 p-3">
                        <div className="mb-3 flex items-center justify-between gap-2 px-1">
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><h2 className="text-sm font-semibold">{stage.name}</h2></div>
                            <Badge variant="secondary" className="text-xs">{stage.deals.length}</Badge>
                        </div>
                        <div className="space-y-2">
                            {stage.deals.length === 0 && <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Nenhuma oportunidade</p>}
                            {stage.deals.map((deal) => (
                                <Card key={deal.id} className="shadow-sm"><CardContent className="space-y-3 p-3">
                                    <div><p className="text-sm font-medium leading-snug">{deal.title}</p><p className="mt-1 text-sm font-semibold">{money.format(deal.valueCents / 100)}</p></div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {deal.contact && <Badge variant="secondary" className="max-w-full truncate">{deal.contact.name || deal.contact.notify || "Contato"}</Badge>}
                                        {deal.product && <Badge variant="outline" className="max-w-full truncate">{deal.product.name}</Badge>}
                                        {deal.leadSource && <span className="text-xs text-muted-foreground">Origem: {deal.leadSource}</span>}
                                    </div>
                                    <Select value={stage.id} onValueChange={(next) => moveDeal(deal.id, next)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{pipeline.stages.map(nextStage => <SelectItem key={nextStage.id} value={nextStage.id}>{nextStage.name}</SelectItem>)}</SelectContent></Select>
                                </CardContent></Card>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function Metric({ icon: Icon, label, value, detail, tone = "text-primary" }: { icon: typeof Target; label: string; value: string; detail: string; tone?: string }) {
    return <Card><CardContent className="flex items-start gap-3 p-4"><div className={`rounded-lg bg-muted p-2 ${tone}`}><Icon className="h-4 w-4" /></div><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>;
}
