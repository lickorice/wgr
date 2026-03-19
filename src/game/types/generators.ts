import { type ContentStatus } from "./shared"
import { type Cost } from "./resources"
import { type UnlockId } from "./unlocks"

export const GeneratorKey = {
  PlanetaryLumiumCollector: "PlanetaryLumiumCollector",
  RegolithAccumulator: "RegolithAccumulator",
  MolecularAssembler: "MolecularAssembler",
} as const

export type GeneratorId = (typeof GeneratorKey)[keyof typeof GeneratorKey];

export type GeneratorSpec = {
  id: GeneratorId;
  longName: string;
  flavorText: string;
  baseGainPerSec: Cost[];
  baseConsumePerSec?: Cost[];
  baseCost: Cost[];
  growthFactor: number;
  weight: number;
  toggleable: boolean;
  prerequisites?: UnlockId[];
  metaText?: string;
  defaultAmount?: number;
};

export type GeneratorState = {
  id: GeneratorId;
  spec: GeneratorSpec;
  status: ContentStatus;
  amount: number;
  efficiency: number;
  toggled?: number;
  element?: HTMLElement;
};

export type GeneratorStateLookup = Record<GeneratorId, GeneratorState>;
