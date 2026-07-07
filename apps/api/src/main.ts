import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { parseCorsOrigins } from './common/cors-origins';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { applyRequestLogging } from './common/request-logging';
import { applySecurityHeaders } from './common/security-headers';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';

function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

async function bootstrap() {
  initSentry();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    (process.env.SWAGGER_ENABLED !== 'false' && process.env.NODE_ENV !== 'production');

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: swaggerEnabled
      ? {
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'data:'],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            upgradeInsecureRequests: null,
          },
        }
      : {
          directives: {
            defaultSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'none'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
          },
        },
    crossOriginEmbedderPolicy: false,
  });

  applySecurityHeaders(app.getHttpAdapter().getInstance());
  applyRequestLogging(app.getHttpAdapter().getInstance());
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: Number(process.env.AI_MAX_IMAGE_SIZE_BYTES ?? 4 * 1024 * 1024),
      files: 1,
      fields: 2,
      parts: 3,
    },
    throwFileSizeLimit: true,
  });

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, corsOrigins.includes(origin.toLowerCase()));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Vivu API')
      .setDescription('REST API for the Vivu travel platform')
      .setVersion('0.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`Vivu API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
