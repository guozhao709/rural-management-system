import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { StructuredLlmPort } from '../ports/structured-llm.port';
@Injectable()
export class UnavailableStructuredLlmAdapter implements StructuredLlmPort {
  async generate(prompt: string): ReturnType<StructuredLlmPort['generate']> {
    void prompt;
    throw new ServiceUnavailableException('LLM 未配置');
  }
}
