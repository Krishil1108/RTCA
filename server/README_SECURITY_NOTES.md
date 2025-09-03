### Security & Validation Enhancements

This backend has the following protections applied:

1. Helmet hardening with baseline CSP (script/style allow 'self' plus temporary 'unsafe-inline'; remove inline allowance soon).
2. Per-user (not IP) in-memory rate limits for message send and reactions (socket layer).
3. Message validation: length (<=2000), non-empty, allowed types: text,image,video,audio,file,deleted.
4. Reaction validation and throttling to reduce abuse.
5. Structured logging via pino + HTTP middleware (redacts auth headers & sensitive tokens).
6. Graceful shutdown for clean Mongo disconnect.
7. Duplicate health endpoints removed; single `/api/health` with uptime.
8. CORS restricted to explicit allowed origins.

Recommended next steps (not yet implemented):
 - Redis-backed distributed rate limiting.
 - Tighten CSP (remove 'unsafe-inline', add hashes/nonces; enumerate websocket origins).
 - File/attachment scanning middleware before persisting uploads.
 - Central request ID correlation (add req.id to pino child logger).
 - JWT rotation / refresh token strategy.
 - Audit log collection for admin actions.

Update this document when new controls are added.
