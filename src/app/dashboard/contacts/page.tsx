
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/components/dashboard/session-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";

import { Search, Loader2, User, Upload, Trash2, FileSpreadsheet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SessionGuard } from "@/components/dashboard/session-guard";
import { toast } from "sonner";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Contact {
    id: string;
    jid: string;
    name?: string;
    notify?: string;
    verifiedName?: string;
    profilePic?: string;
    remoteJidAlt?: string;
}

function parseContactsCsv(text: string) {
    const source = text.replace(/^\uFEFF/, "");
    const separator = source.split(/\r?\n/, 1)[0].includes(";") ? ";" : ",";
    const rows: string[][] = [];
    let row: string[] = [], value = "", quoted = false;
    for (let index = 0; index < source.length; index++) {
        const char = source[index];
        if (char === '"') {
            if (quoted && source[index + 1] === '"') { value += '"'; index++; }
            else quoted = !quoted;
        } else if (char === separator && !quoted) { row.push(value.trim()); value = ""; }
        else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && source[index + 1] === "\n") index++;
            row.push(value.trim());
            if (row.some(cell => cell)) rows.push(row);
            row = []; value = "";
        } else value += char;
    }
    row.push(value.trim());
    if (row.some(cell => cell)) rows.push(row);
    if (rows.length < 2) throw new Error("O arquivo precisa ter cabeçalho e ao menos um contato.");
    const headers = rows[0].map(header => header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const get = (line: string[], names: string[]) => line[headers.findIndex(header => names.includes(header))] || "";
    const contacts = rows.slice(1).map(row => ({
        name: get(row, ["nome", "name"]),
        phone: get(row, ["telefone", "phone", "celular", "whatsapp"]),
        email: get(row, ["email", "e-mail"]),
        city: get(row, ["cidade", "city"]),
        profession: get(row, ["profissao", "profission", "occupation"]),
        productInterest: get(row, ["produto", "produto de interesse", "interesse"]),
        tags: get(row, ["tags", "etiquetas"]).split(/[|,]/).map(tag => tag.trim()).filter(Boolean),
    })).filter(contact => contact.phone);
    if (!contacts.length) throw new Error("Não encontrei uma coluna de telefone preenchida.");
    return contacts;
}

export default function ContactListPage() {
    const { sessionId } = useSession();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState("10");
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
    const [importing, setImporting] = useState(false);
    const [deleting, setDeleting] = useState<Contact | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [allMatchingSelected, setAllMatchingSelected] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reset to page 1 on search
            fetchContacts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch on page/session/limit change
    useEffect(() => {
        fetchContacts();
    }, [page, sessionId, limit]);

    const fetchContacts = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit,
                search: search
            });

            const res = await fetch(`/api/contacts/${sessionId}?${params}`);
            const data = await res.json();

            if (res.ok) {
                setContacts(data.data);
                setMeta(data.meta);
            } else {
                setContacts([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const importContacts = async (file?: File) => {
        if (!file || !sessionId) return;
        setImporting(true);
        try {
            const contacts = parseContactsCsv(await file.text());
            const response = await fetch(`/api/contacts/${sessionId}/import`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contacts }),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível importar os contatos");
            const { created, updated, skipped } = json.data;
            toast.success(`${created} contato(s) importado(s), ${updated} atualizado(s)${skipped.length ? ` e ${skipped.length} ignorado(s)` : ""}.`);
            setPage(1);
            await fetchContacts();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha na importação");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const deleteContact = async () => {
        if (!deleting || !sessionId) return;
        try {
            const response = await fetch(`/api/contacts/${sessionId}/${deleting.id}`, { method: "DELETE" });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível excluir o contato");
            toast.success("Contato removido do MarcFlow");
            setDeleting(null);
            await fetchContacts();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao excluir contato");
        }
    };

    const selectedCount = allMatchingSelected ? meta.total : selectedIds.size;
    const allOnPageSelected = contacts.length > 0 && contacts.every(contact => selectedIds.has(contact.id));
    const toggleContact = (id: string, checked: boolean) => {
        setAllMatchingSelected(false);
        setSelectedIds(previous => {
            const next = new Set(previous);
            if (checked) next.add(id); else next.delete(id);
            return next;
        });
    };
    const togglePage = (checked: boolean) => {
        setAllMatchingSelected(false);
        setSelectedIds(checked ? new Set(contacts.map(contact => contact.id)) : new Set());
    };
    const clearSelection = () => { setSelectedIds(new Set()); setAllMatchingSelected(false); };
    const deleteSelectedContacts = async () => {
        if (!sessionId || selectedCount === 0) return;
        setBulkDeleting(true);
        try {
            const response = await fetch(`/api/contacts/${sessionId}/bulk`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contactIds: [...selectedIds], allMatching: allMatchingSelected, search }),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Não foi possível excluir os contatos selecionados");
            toast.success(`${json.data.deleted} contato(s) removido(s) do MarcFlow`);
            setBulkDeleteOpen(false);
            clearSelection();
            if (contacts.length === selectedCount && page > 1) setPage(current => current - 1);
            await fetchContacts();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao excluir contatos");
        } finally {
            setBulkDeleting(false);
        }
    };

    return (
        <SessionGuard>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Contatos</h2>
                        <p className="text-muted-foreground">
                            Gerencie e veja seus contatos salvos.
                        </p>
                    </div>
                    <div>
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={event => importContacts(event.target.files?.[0])} />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {importing ? "Importando…" : "Importar contatos"}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="space-y-1">
                                <CardTitle>Lista de contatos</CardTitle>
                                <CardDescription>
                                    Total: {meta.total} contatos encontrados
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Select value={limit} onValueChange={(val) => { clearSelection(); setLimit(val); setPage(1); }}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Por página" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map((l) => (
                                            <SelectItem key={l} value={l.toString()}>
                                                {l} / página
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="all">Mostrar todos</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar contatos..."
                                        className="pl-8"
                                        value={search}
                                        onChange={(e) => { clearSelection(); setSearch(e.target.value); }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCount > 0 && (
                            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between" role="status">
                                <div className="text-sm"><span className="font-semibold text-primary">{selectedCount}</span> contato{selectedCount === 1 ? "" : "s"} selecionado{selectedCount === 1 ? "" : "s"}.</div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {!allMatchingSelected && selectedIds.size === contacts.length && meta.total > contacts.length && (
                                        <Button variant="outline" size="sm" onClick={() => setAllMatchingSelected(true)}>Selecionar todos os {meta.total} resultados</Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={clearSelection}>Limpar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Excluir selecionados</Button>
                                </div>
                            </div>
                        )}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[48px] px-3">
                                            <Checkbox checked={allMatchingSelected || allOnPageSelected} onCheckedChange={checked => togglePage(checked === true)} aria-label="Selecionar contatos desta página" />
                                        </TableHead>
                                        <TableHead className="w-[80px]">Foto</TableHead>
                                        <TableHead>Nome / Nome de exibição</TableHead>
                                        <TableHead className="hidden md:table-cell">JID (ID)</TableHead>
                                        <TableHead className="hidden md:table-cell">Telefone / Alternativo</TableHead>
                                        <TableHead className="w-[80px] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Carregando...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : contacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Nenhum contato encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        contacts.map((contact) => (
                                            <TableRow key={contact.id}>
                                                <TableCell className="px-3"><Checkbox checked={allMatchingSelected || selectedIds.has(contact.id)} onCheckedChange={checked => toggleContact(contact.id, checked === true)} aria-label={`Selecionar ${contact.name || contact.notify || "contato"}`} /></TableCell>
                                                <TableCell>
                                                    <Avatar>
                                                        <AvatarImage src={`/api/chat/${sessionId}/${encodeURIComponent(contact.jid)}/avatar`} alt="" />
                                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{contact.name || contact.notify || "Desconhecido"}</span>
                                                        {contact.verifiedName && (
                                                            <span className="text-xs text-green-600 flex items-center gap-1">
                                                                ✓ {contact.verifiedName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                                                    {contact.jid}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-sm">
                                                    {contact.remoteJidAlt || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir contato" onClick={() => setDeleting(contact)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {meta.totalPages > 1 && (
                            <div className="mt-4">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <Button
                                                variant="ghost"
                                                disabled={page <= 1}
                                                onClick={() => { clearSelection(); setPage(p => Math.max(1, p - 1)); }}
                                            >
                                                Anterior
                                            </Button>
                                        </PaginationItem>

                                        <PaginationItem>
                                            <span className="text-sm text-muted-foreground mx-4">
                                                Página {page} de {meta.totalPages}
                                            </span>
                                        </PaginationItem>

                                        <PaginationItem>
                                            <Button
                                                variant="ghost"
                                                disabled={page >= meta.totalPages}
                                                onClick={() => { clearSelection(); setPage(p => Math.min(meta.totalPages, p + 1)); }}
                                            >
                                                Próxima
                                            </Button>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <p className="flex items-start gap-2 text-xs text-muted-foreground"><FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0" />Importe CSV com as colunas: nome, telefone, e-mail, cidade, profissão, produto e tags. A exclusão remove apenas o registro do MarcFlow, nunca o contato do WhatsApp.</p>
            </div>
            <AlertDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Excluir contato?</AlertDialogTitle><AlertDialogDescription>O contato será removido do MarcFlow. As mensagens históricas continuam preservadas.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteContact}>Excluir contato</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {selectedCount} contato{selectedCount === 1 ? "" : "s"}?</AlertDialogTitle>
                        <AlertDialogDescription>{allMatchingSelected ? "Todos os resultados do filtro atual serão removidos do MarcFlow." : "Os contatos selecionados serão removidos do MarcFlow."} As mensagens históricas continuam preservadas.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={bulkDeleting} onClick={deleteSelectedContacts}>{bulkDeleting ? "Excluindo…" : "Excluir contatos"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SessionGuard>
    );
}
