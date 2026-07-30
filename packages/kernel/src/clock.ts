/**
 * Deterministic clock abstraction (Doc 13 §36: environments must support a
 * deterministic test clock). Domain and application code must depend on
 * Clock, never on Date.now directly, so tests and the synthetic Pilot stay
 * reproducible.
 */
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock implements Clock {
  private current: Date;

  constructor(start: Date | string) {
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(to: Date | string): void {
    this.current = new Date(to);
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
