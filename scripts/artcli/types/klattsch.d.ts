// Really simple shim for klattsch since it doesn't have types
declare module "klattsch" {
  export interface ScheduleEvent {
    atMs?: number;
    target: Record<string, number>;
    transitionMs?: number;
  }

  export interface Compiled {
    schedule: ScheduleEvent[];
    totalMs: number;
    warnings: string[];
  }

  export function compileString(
    input: string,
    options?: { rate?: number; baseF0?: number },
  ): Compiled;

  export class FormantSynth {
    constructor(options: { sampleRate: number; schedule?: ScheduleEvent[] });
    process(out: Float32Array): void;
  }

  export function encodeWav(
    samples: Float32Array,
    sampleRate: number,
  ): { bytes: Uint8Array; gain: number };
}
