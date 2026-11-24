import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [address, prefix] of [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
    ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
    ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
    ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [
    ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10],
    ["ff00::", 8], ["::ffff:0:0", 96], ["2001:db8::", 32],
] as const) blocked.addSubnet(address, prefix, "ipv6");

export async function resolveWebhookTarget(input: string) {
    let url: URL;
    try { url = new URL(input); } catch { throw new Error("URL do webhook inválida"); }
    if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") {
        throw new Error("O webhook exige uma URL HTTPS pública sem credenciais ou porta alternativa");
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
        throw new Error("Endereço privado não permitido");
    }
    const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address, family }) => blocked.check(address, family === 4 ? "ipv4" : "ipv6"))) {
        throw new Error("Endereço privado não permitido");
    }
    return { url, address: addresses[0].address, family: addresses[0].family };
}

export async function postWebhook(input: string, headers: Record<string, string>, body: string, timeoutMs: number) {
    const { url, address, family } = await resolveWebhookTarget(input);
    return new Promise<{ ok: boolean; status: number; statusText: string; body: string }>((resolve, reject) => {
        const req = httpsRequest(url, {
            method: "POST", headers, timeout: timeoutMs,
            lookup: (_hostname, _options, callback) => callback(null, address, family),
        }, (res) => {
            let responseBody = "";
            res.setEncoding("utf8");
            res.on("data", (chunk: string) => { responseBody += chunk.slice(0, Math.max(0, 1024 - responseBody.length)); });
            res.on("end", () => resolve({
                ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode ?? 0,
                statusText: res.statusMessage ?? "",
                body: responseBody,
            }));
        });
        const deadline = setTimeout(() => req.destroy(new Error("Tempo limite do webhook excedido")), timeoutMs);
        req.on("close", () => clearTimeout(deadline));
        req.on("timeout", () => req.destroy(new Error("Tempo limite do webhook excedido")));
        req.on("error", reject);
        req.end(body);
    });
}
