import { cropAnalysisResultSchema } from './crop-analysis-result.schema';
const valid = {
  schemaVersion: '1.0',
  overview: 'o',
  suitability: { level: 'high', score: 80, reasons: ['r'] },
  risks: [],
  actions: [],
  knowledgeReferences: [],
  contextWarnings: ['实时天气未接入'],
  disclaimer: 'd',
};
describe('cropAnalysisResultSchema', () => {
  it('accepts a valid result', () => expect(cropAnalysisResultSchema.parse(valid)).toEqual(valid));
  it('rejects out of range score', () =>
    expect(() =>
      cropAnalysisResultSchema.parse({
        ...valid,
        suitability: { ...valid.suitability, score: 101 },
      }),
    ).toThrow());
});
