import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';
import {
  DEFAULT_SUCCESS_MESSAGE,
  RESPONSE_MESSAGE_KEY,
  SKIP_RESPONSE_ENVELOPE_KEY,
} from '../constants/http.constants';
import type { ApiResponse } from '../types/api-response.type';

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<
  T,
  T | ApiResponse<T | null>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | ApiResponse<T | null>> {
    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_SUCCESS_MESSAGE;
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (
          skipEnvelope ||
          data instanceof StreamableFile ||
          this.hasSpecialContentType(response)
        ) {
          return data;
        }

        return {
          code: response.statusCode,
          message,
          data: data ?? null,
        };
      }),
    );
  }

  private hasSpecialContentType(response: Response): boolean {
    const contentType = response.getHeader('content-type');

    if (typeof contentType !== 'string') {
      return false;
    }

    return (
      contentType.includes('text/event-stream') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/pdf')
    );
  }
}
