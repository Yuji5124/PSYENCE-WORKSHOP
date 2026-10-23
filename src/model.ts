export type RiffStep = {
  pitch: number | null;
  length: 0.5 | 1 | 1.5;
  accent: boolean;
};

export type DrumStep = {
  kick: boolean;
  snare: boolean;
  hat: boolean;
};

export type Experiment = {
  bpm: number;
  seed: string;
  riff: RiffStep[];
  drums: DrumStep[];
  tone: { distortion: number; filter: number };
  createdAt: string;
};

export type ExperimentDocument = {
  experiment_id: 'EXP-001';
  title: 'PINK NOISE';
  artist: 'ZIG';
  bpm: number;
  seed: string;
  steps: { riff: RiffStep[]; drums: DrumStep[] };
  tone: { distortion: number; filter: number };
  created_at: string;
  version: 1;
};

export const DEFAULT_EXPERIMENT: Experiment = {
  bpm: 120,
  seed: 'ZIG-001',
  riff: [
    { pitch: 40, length: 1, accent: true },
    { pitch: null, length: 0.5, accent: false },
    { pitch: 43, length: 1, accent: false },
    { pitch: 47, length: 1.5, accent: true },
    { pitch: 45, length: 0.5, accent: false },
    { pitch: 38, length: 1, accent: true },
    { pitch: 50, length: 1, accent: false },
    { pitch: null, length: 1, accent: false },
  ],
  drums: Array.from({ length: 16 }, (_, index) => ({
    kick: [0, 6, 10].includes(index),
    snare: [4, 12].includes(index),
    hat: [2, 6, 8, 11, 14].includes(index),
  })),
  tone: { distortion: 42, filter: 3200 },
  createdAt: new Date().toISOString(),
};

export function cloneExperiment(experiment: Experiment): Experiment {
  return {
    ...experiment,
    riff: experiment.riff.map((step) => ({ ...step })),
    drums: experiment.drums.map((step) => ({ ...step })),
    tone: { ...experiment.tone },
  };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export function seededRandom(seed: string): () => number {
  let value = hashSeed(seed);
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 0x1_0000_0000;
  };
}

const PITCH_POOL = [36, 38, 40, 41, 43, 45, 47, 48, 50, 52, 53, 55, 57, 59];

export function mutateExperiment(experiment: Experiment): { next: Experiment; changed: number[] } {
  const next = cloneExperiment(experiment);
  const random = seededRandom(`${experiment.seed}|${experiment.riff.map((step) => step.pitch ?? 'x').join(',')}`);
  const count = 1 + Math.floor(random() * 3);
  const candidates = next.riff.map((_, index) => index);
  const chosen: number[] = [];
  while (chosen.length < count && candidates.length > 0) {
    chosen.push(candidates.splice(Math.floor(random() * candidates.length), 1)[0]);
  }
  for (const index of chosen) {
    const current = next.riff[index].pitch;
    const alternatives = PITCH_POOL.filter((pitch) => pitch !== current);
    next.riff[index].pitch = alternatives[Math.floor(random() * alternatives.length)];
  }
  return { next, changed: chosen.sort((a, b) => a - b) };
}

export function createRandomSeed(): string {
  const bytes = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else bytes[0] = Math.floor(Math.random() * 0xffff_ffff);
  return bytes[0].toString(16).toUpperCase().padStart(8, '0');
}

export function toDocument(experiment: Experiment): ExperimentDocument {
  return {
    experiment_id: 'EXP-001',
    title: 'PINK NOISE',
    artist: 'ZIG',
    bpm: experiment.bpm,
    seed: experiment.seed,
    steps: {
      riff: experiment.riff.map((step) => ({ ...step })),
      drums: experiment.drums.map((step) => ({ ...step })),
    },
    tone: { ...experiment.tone },
    created_at: experiment.createdAt,
    version: 1,
  };
}

export function fromDocument(value: unknown): Experiment {
  if (!value || typeof value !== 'object') throw new Error('JSONの形式が正しくありません。');
  const doc = value as Partial<ExperimentDocument>;
  if (doc.experiment_id !== 'EXP-001' || doc.version !== 1 || !doc.steps || !doc.tone) {
    throw new Error('EXP-001 version 1 のJSONではありません。');
  }
  if (!Number.isFinite(doc.bpm) || (doc.bpm as number) < 60 || (doc.bpm as number) > 180) {
    throw new Error('BPMは60〜180の範囲で指定してください。');
  }
  if (!Array.isArray(doc.steps.riff) || doc.steps.riff.length !== 8 || !Array.isArray(doc.steps.drums) || doc.steps.drums.length !== 16) {
    throw new Error('リフは8ステップ、ドラムは16ステップ必要です。');
  }
  const riff = doc.steps.riff.map((step) => {
    if (!step || (step.pitch !== null && (!Number.isInteger(step.pitch) || step.pitch < 24 || step.pitch > 84)) || ![0.5, 1, 1.5].includes(step.length) || typeof step.accent !== 'boolean') {
      throw new Error('リフステップの値が正しくありません。');
    }
    return { pitch: step.pitch, length: step.length, accent: step.accent };
  });
  const drums = doc.steps.drums.map((step) => {
    if (!step || typeof step.kick !== 'boolean' || typeof step.snare !== 'boolean' || typeof step.hat !== 'boolean') {
      throw new Error('ドラムステップの値が正しくありません。');
    }
    return { kick: step.kick, snare: step.snare, hat: step.hat };
  });
  if (!Number.isFinite(doc.tone.distortion) || !Number.isFinite(doc.tone.filter)) throw new Error('音色パラメータが正しくありません。');
  return {
    bpm: doc.bpm as number,
    seed: typeof doc.seed === 'string' ? doc.seed : 'ZIG-001',
    riff,
    drums,
    tone: { distortion: Math.max(0, Math.min(100, doc.tone.distortion)), filter: Math.max(200, Math.min(8000, doc.tone.filter)) },
    createdAt: typeof doc.created_at === 'string' ? doc.created_at : new Date().toISOString(),
  };
}

export function midiLabel(midi: number | null): string {
  if (midi === null) return 'REST';
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
