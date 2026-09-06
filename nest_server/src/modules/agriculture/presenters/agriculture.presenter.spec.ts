import { AnalysisStatus } from '../agriculture.enums';
import { CropAnalysis } from '../entities/crop-analysis.entity';
import { AnalysisPresenter } from './agriculture.presenter';

describe('AnalysisPresenter', () => {
  it('converts a bigint analysis id to a JSON-safe string', () => {
    const entity = {
      id: 9007199254740993n,
      crop: { id: 7 },
      cropNameSnapshot: '水稻',
      regionCode: 'CN-430100',
      regionName: '长沙市',
      status: AnalysisStatus.Succeeded,
      result: { summary: '正常' },
      schemaVersion: '1.0',
      promptVersion: 'm08-v1',
      modelProvider: 'openai-compatible',
      modelName: 'kimi-k2.6',
      durationMs: 27620,
      createdAt: new Date('2026-09-06T08:42:00.000Z'),
      completedAt: new Date('2026-09-06T08:42:27.620Z'),
    } as unknown as CropAnalysis;

    const response = AnalysisPresenter.from(entity);

    expect(response.id).toBe('9007199254740993');
    expect(() => JSON.stringify(response)).not.toThrow();
  });
});
