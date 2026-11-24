const IBB_PAGE_HOST = "ibb.co";
const IBB_IMAGE_HOST = "i.ibb.co";

function decodeHtmlAttribute(value: string) {
    return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}

export async function normalizeBrandImageUrl(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return "";
    const input = value.trim();
    if (input.startsWith("/") && !input.startsWith("//")) return input;

    let url: URL;
    try {
        url = new URL(input);
    } catch {
        throw new Error("Informe uma URL válida para a imagem");
    }

    if (url.protocol !== "https:") throw new Error("A URL da imagem deve usar HTTPS");
    if (url.hostname !== IBB_PAGE_HOST) return url.toString();

    const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(8_000),
        headers: { "User-Agent": "MarcFlow/1.0" },
    });
    if (!response.ok) throw new Error("Não foi possível abrir o link do ibb.co");

    const html = (await response.text()).slice(0, 1_000_000);
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (!match) throw new Error("O link do ibb.co não contém uma imagem pública");

    const directUrl = new URL(decodeHtmlAttribute(match[1]));
    if (directUrl.protocol !== "https:" || directUrl.hostname !== IBB_IMAGE_HOST) {
        throw new Error("O link do ibb.co retornou um endereço de imagem inválido");
    }
    return directUrl.toString();
}
