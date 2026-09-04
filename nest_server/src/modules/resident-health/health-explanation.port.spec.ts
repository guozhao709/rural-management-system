import { ServiceUnavailableException } from '@nestjs/common';
import { UnavailableHealthExplanationAdapter } from './health-explanation.port';

describe('UnavailableHealthExplanationAdapter', () => {
  it('fails explicitly rather than fabricating a low-risk explanation', async () => {
    await expect(new UnavailableHealthExplanationAdapter().explain({
      triage: { level: 'insufficient', reasonCodes: [], message: '信息不足', ruleVersion: 'v1' }, knowledge: [],
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
