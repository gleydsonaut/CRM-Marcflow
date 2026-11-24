import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET é necessário para proteger webhooks");
    return createHash("sha256").update(`MarcFlow webhook secret:${secret}`).digest();
}

export function encryptWebhookSecret(value: string | null | undefined) {
    if (!value) return null;
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `enc:v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptWebhookSecret(value: string | null | undefined) {
    if (!value || !value.startsWith("enc:v1:")) return value || null;
    const [, , iv, tag, encrypted] = value.split(":");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}
