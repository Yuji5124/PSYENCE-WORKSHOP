import { describe, expect, it } from 'vitest';
import { cloneExperiment, DEFAULT_EXPERIMENT, fromDocument, mutateExperiment, toDocument } from './model';

describe('experiment pattern', () => {
  it('mutates one to three distinct riff steps repeatably from the same seed', () => {
    const first = mutateExperiment(DEFAULT_EXPERIMENT);
    const again = mutateExperiment(DEFAULT_EXPERIMENT);
    expect(first.changed.length).toBeGreaterThanOrEqual(1);
    expect(first.changed.length).toBeLessThanOrEqual(3);
    expect(new Set(first.changed).size).toBe(first.changed.length);
    expect(first.next.riff).toEqual(again.next.riff);
    expect(first.next.drums).toEqual(DEFAULT_EXPERIMENT.drums);
  });

  it('round trips a document without changing the musical state', () => {
    const original = cloneExperiment(DEFAULT_EXPERIMENT);
    const restored = fromDocument(toDocument(original));
    expect(restored).toEqual(original);
  });

  it('rejects documents with an incomplete step array', () => {
    const doc = toDocument(DEFAULT_EXPERIMENT);
    doc.steps.riff.pop();
    expect(() => fromDocument(doc)).toThrow(/8ステップ/);
  });
});
