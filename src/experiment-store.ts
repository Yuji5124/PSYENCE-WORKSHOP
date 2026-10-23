import type { ExperimentDocument } from './model';

/** Persistence boundary for experiment destinations, including a future SOUNDVAULT adapter. */
export interface ExperimentStore {
  save(document: ExperimentDocument): void;
  load(): unknown | null;
}

export class BrowserExperimentStore implements ExperimentStore {
  constructor(private readonly getStorage: () => Storage = () => window.localStorage) {}

  save(document: ExperimentDocument): void {
    this.getStorage().setItem('psyence-workshop:exp-001', JSON.stringify(document));
  }

  load(): unknown | null {
    const value = this.getStorage().getItem('psyence-workshop:exp-001');
    return value === null ? null : JSON.parse(value);
  }
}

export const experimentStore: ExperimentStore = new BrowserExperimentStore();
