import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

const GENERIC_SERVER_MESSAGE = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly exposeDetails: boolean;

  constructor() {
    this.exposeDetails =
      process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { status, message, error } = this.resolveException(exception);

    if (status >= 500) {
      this.logger.error(
        JSON.stringify({
          path: request.url,
          method: request.method,
          status,
          message: this.describeForLogs(exception),
        }),
      );
    }

    void response.status(status).send({
      statusCode: status,
      message,
      ...(error ? { error } : {}),
    });
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string | string[];
    error?: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { status, message: body };
      }
      if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>;
        const message = record.message ?? exception.message;
        const error = typeof record.error === 'string' ? record.error : undefined;
        return {
          status,
          message:
            Array.isArray(message) || typeof message === 'string'
              ? message
              : GENERIC_SERVER_MESSAGE,
          error,
        };
      }
      return { status, message: exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: this.exposeDetails
          ? `Database request failed (${exception.code}).`
          : 'Yêu cầu không hợp lệ.',
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: this.exposeDetails ? 'Database validation failed.' : 'Yêu cầu không hợp lệ.',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        this.exposeDetails && exception instanceof Error
          ? exception.message
          : GENERIC_SERVER_MESSAGE,
      error: 'Internal Server Error',
    };
  }

  private describeForLogs(exception: unknown): string {
    if (exception instanceof Error) return exception.stack ?? exception.message;
    return String(exception);
  }
}
