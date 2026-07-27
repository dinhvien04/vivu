import { Logger } from '@nestjs/common';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pathnameOnly } from './safe-request-url';

const logger = new Logger('Http');
const START_TIME = Symbol('vivuRequestStartTime');

type TimedRequest = FastifyRequest & { [START_TIME]?: number };

export function applyRequestLogging(app: FastifyInstance): void {
  app.addHook('onRequest', (request: TimedRequest, _reply, done) => {
    request[START_TIME] = Date.now();
    done();
  });

  app.addHook('onResponse', (request: TimedRequest, reply, done) => {
    const latencyMs = Date.now() - (request[START_TIME] ?? Date.now());
    logger.log(
      JSON.stringify({
        method: request.method,
        path: pathnameOnly(request.url),
        statusCode: reply.statusCode,
        latencyMs,
        requestId: request.id,
      }),
    );
    done();
  });

  app.addHook('onError', (request: TimedRequest, reply, error, done) => {
    const latencyMs = Date.now() - (request[START_TIME] ?? Date.now());
    logger.error(
      JSON.stringify({
        method: request.method,
        path: pathnameOnly(request.url),
        statusCode: reply.statusCode,
        latencyMs,
        requestId: request.id,
        error: error.name,
      }),
    );
    done();
  });
}
