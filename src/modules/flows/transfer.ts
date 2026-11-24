import type { FlowGraph, FlowNode, NodeType } from "./types";

export const FLOW_TRANSFER_FORMAT = "marcflow.flow";
export const FLOW_TRANSFER_VERSION = 1;
export const FLOW_TRANSFER_MAX_BYTES = 2_000_000;

const NODE_TYPES = new Set<NodeType>(["start", "content", "menu", "action", "condition", "randomizer", "smartDelay", "flowLink"]);
const TRIGGER_TYPES = new Set(["KEYWORD", "FIRST_MESSAGE", "ANY_MESSAGE"]);
const MATCH_TYPES = new Set(["EXACT", "WORD", "CONTAINS", "REGEX"]);

export interface TransferTrigger {
    type: string;
    keyword: string | null;
    matchType: string | null;
    priority: number;
}

export interface FlowTransfer {
    format: typeof FLOW_TRANSFER_FORMAT;
    version: typeof FLOW_TRANSFER_VERSION;
    exportedAt: string;
    flow: { name: string; graph: FlowGraph; triggers: TransferTrigger[] };
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number) => typeof value === "string" && value.length > 0 && value.length <= max;
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const optionalText = (value: unknown, max: number) => value === undefined || (typeof value === "string" && value.length <= max);

function validContentItem(item: unknown) {
    if (!record(item) || !text(item.id, 100) || !text(item.kind, 30)) return false;
    switch (item.kind) {
        case "text": return typeof item.text === "string";
        case "image": case "video": case "audio": case "file":
            return optionalText(item.assetId, 200) && optionalText(item.url, 4_000) && optionalText(item.caption, 10_000) && optionalText(item.fileName, 255);
        case "delay": return finite(item.seconds) && typeof item.typing === "boolean";
        case "autoOff": return finite(item.seconds);
        case "vcard": return typeof item.name === "string" && typeof item.phone === "string" && optionalText(item.org, 500);
        case "input":
            return typeof item.question === "string" && text(item.answerType, 30) && finite(item.expireValue)
                && text(item.expireUnit, 20) && typeof item.errorMessage === "string" && finite(item.maxAttempts)
                && optionalText(item.fieldKey, 200) && optionalText(item.fieldScope, 20);
        default: return false;
    }
}

function validNodeData(node: Record<string, unknown>) {
    if (!record(node.data)) return false;
    const data = node.data;
    switch (node.type) {
        case "start": return true;
        case "content":
            return Array.isArray(data.items) && data.items.every(validContentItem);
        case "menu":
            return typeof data.question === "string" && typeof data.invalidText === "string" && finite(data.maxErrors)
                && finite(data.expireValue) && text(data.expireUnit, 20)
                && Array.isArray(data.options) && data.options.every(item => record(item) && text(item.id, 100) && typeof item.text === "string");
        case "action":
            return Array.isArray(data.actions) && data.actions.every(item => record(item) && text(item.id, 100) && text(item.type, 40)
                && (item.type !== "notify" || (typeof item.phones === "string" && typeof item.message === "string")));
        case "condition":
            return (data.logic === "and" || data.logic === "or") && Array.isArray(data.conditions)
                && data.conditions.every(item => record(item) && text(item.id, 100) && text(item.source, 30) && text(item.op, 30) && typeof item.value === "string");
        case "randomizer":
            return (data.mode === "random" || data.mode === "sequential") && Array.isArray(data.options)
                && data.options.every(item => record(item) && text(item.id, 100) && finite(item.weight));
        case "smartDelay":
            return (data.mode === "duration" || data.mode === "datetime") && finite(data.value) && typeof data.unit === "string";
        case "flowLink": return true;
        default: return false;
    }
}

export function sanitizeFlowGraph(value: unknown): FlowGraph {
    if (!record(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) throw new Error("O JSON não contém um grafo com nodes e edges");
    if (value.nodes.length > 500 || value.edges.length > 1_500) throw new Error("O fluxo excede o limite de 500 blocos ou 1.500 conexões");

    const ids = new Set<string>();
    const nodes = value.nodes.map((item, index) => {
        if (!record(item) || !text(item.id, 100) || !text(item.type, 30) || !NODE_TYPES.has(item.type as NodeType)
            || !record(item.position) || !finite(item.position.x) || !finite(item.position.y) || !validNodeData(item)) {
            throw new Error(`Bloco inválido na posição ${index + 1}`);
        }
        if (ids.has(item.id as string)) throw new Error(`ID de bloco duplicado: ${item.id}`);
        ids.add(item.id as string);
        return { id: item.id, type: item.type, position: { x: item.position.x, y: item.position.y }, data: item.data } as FlowNode;
    });
    if (nodes.filter(node => node.type === "start").length !== 1) throw new Error("O fluxo precisa ter exatamente um bloco inicial");

    const edgeIds = new Set<string>();
    const edges = value.edges.map((item, index) => {
        if (!record(item) || !text(item.id, 100) || !text(item.source, 100) || !text(item.target, 100)
            || !text(item.sourceHandle, 150) || !ids.has(item.source as string) || !ids.has(item.target as string)) {
            throw new Error(`Conexão inválida na posição ${index + 1}`);
        }
        if (edgeIds.has(item.id as string)) throw new Error(`ID de conexão duplicado: ${item.id}`);
        edgeIds.add(item.id as string);
        return { id: item.id as string, source: item.source as string, target: item.target as string, sourceHandle: item.sourceHandle as string };
    });
    return { nodes, edges };
}

function sanitizeTriggers(value: unknown): TransferTrigger[] {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > 100) throw new Error("Lista de gatilhos inválida");
    return value.map((item, index) => {
        if (!record(item) || !TRIGGER_TYPES.has(String(item.type))) throw new Error(`Gatilho inválido na posição ${index + 1}`);
        const type = String(item.type);
        const keyword = type === "KEYWORD" ? String(item.keyword || "").trim().slice(0, 200) : null;
        const matchType = type === "KEYWORD" ? String(item.matchType || "EXACT") : null;
        if (type === "KEYWORD" && (!keyword || !MATCH_TYPES.has(matchType!))) throw new Error(`Gatilho de palavra-chave inválido na posição ${index + 1}`);
        if (matchType === "REGEX") { try { new RegExp(keyword!); } catch { throw new Error(`Expressão regular inválida na posição ${index + 1}`); } }
        return { type, keyword, matchType, priority: Math.max(-10_000, Math.min(10_000, Number(item.priority) || 0)) };
    });
}

export function parseFlowTransfer(value: unknown) {
    if (!record(value)) throw new Error("O arquivo precisa conter um objeto JSON");
    let source: Record<string, unknown> = value;
    if (value.format !== undefined) {
        if (value.format !== FLOW_TRANSFER_FORMAT || value.version !== FLOW_TRANSFER_VERSION || !record(value.flow)) {
            throw new Error("Formato ou versão de fluxo não suportado");
        }
        source = value.flow;
    }
    const graphValue = source.graph ?? source.draftGraph ?? (Array.isArray(source.nodes) && Array.isArray(source.edges) ? source : undefined);
    const graph = sanitizeFlowGraph(graphValue);
    const name = String(source.name || value.name || "Fluxo importado").trim().slice(0, 120) || "Fluxo importado";
    const triggers = sanitizeTriggers(source.triggers ?? value.triggers);
    const warnings: string[] = [];
    const serialized = JSON.stringify(graph);
    if (serialized.includes('"assetId"')) warnings.push("Mídias enviadas ao armazenamento original podem precisar ser reenviadas.");
    if (serialized.includes('"flowId"')) warnings.push("Conexões com outros fluxos devem ser revisadas.");
    return { name, graph, triggers, warnings };
}

export function createFlowTransfer(name: string, graph: FlowGraph, triggers: TransferTrigger[]): FlowTransfer {
    return { format: FLOW_TRANSFER_FORMAT, version: FLOW_TRANSFER_VERSION, exportedAt: new Date().toISOString(), flow: { name, graph, triggers } };
}
