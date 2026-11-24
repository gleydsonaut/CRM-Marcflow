# MarcFlow engineering guide

## Architecture boundaries

- Route handlers must authenticate and authorize at the handler boundary. Never rely only on `src/proxy.ts` or hidden navigation links.
- Access to a WhatsApp session must use the shared session-access helpers; a database ID and the external `sessionId` are not interchangeable.
- Browser code must never receive secrets. Only non-sensitive display configuration may use `NEXT_PUBLIC_*` variables.
- Keep one scheduler owner per job family. Scheduled-message dispatch lives in `src/lib/cron.ts`.
- Navigation definitions live in `src/components/dashboard/navigation.ts` and are consumed by desktop and mobile views.
- New request bodies and imported files must be validated before use, preferably with Zod schemas.

## Required verification

Run before handing off a change:

```bash
npm run check
npm run build
```

`npm run lint` enforces the checked-in warning baseline. New errors or increases in any warning category fail the gate. Reduce `eslint-baseline.json` whenever warnings are removed; never increase it to accommodate new debt.

## Security invariants

- `/swagger` and `/api/docs` are `SUPERADMIN`-only.
- Socket.IO origins are explicit; add additional origins through `SOCKET_ALLOWED_ORIGINS`.
- Webhook destinations must remain protected against private/link-local targets and DNS rebinding.
- API keys and webhook secrets must not be stored or returned as plaintext.
- Never commit `.env`, database dumps, WhatsApp auth state, tokens, credentials, or private media.
