import type { FastifyInstance } from 'fastify';

/** Headers not set by @fastify/helmet or that we want to enforce explicitly. */
const SUPPLEMENTAL_HEADERS: Record<string, string> = {
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'off',
};

export function applySecurityHeaders(app: FastifyInstance): void {
  app.addHook('onSend', (_request, reply, payload, done) => {
    for (const [name, value] of Object.entries(SUPPLEMENTAL_HEADERS)) {
      if (!reply.getHeader(name)) {
        reply.header(name, value);
      }
    }
    done(null, payload);
  });
}
