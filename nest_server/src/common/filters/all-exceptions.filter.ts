import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(
        {
          err: exception,
          requestId: request.id,
          method: request.method,
          path: request.originalUrl,
        },
        'HTTP request failed',
      );
    }

    httpAdapter.reply(
      response,
      {
        code: status,
        message: this.getMessage(exception, status),
        data: null,
      },
      status,
    );
  }

  private getMessage(exception: unknown, status: number): string {
    if (!(exception instanceof HttpException)) {
      return '服务端异常';
    }

    const response: unknown = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = response.message;

      if (Array.isArray(message)) {
        return message.map(String).join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return status === 500 ? '服务端异常' : exception.message;
  }
}
