import { type ContentStatus } from "./shared"
import { type Cost } from "./resources"

export const GeneratorKey = {
  PlanetaryLumiumCollector: "PlanetaryLumiumCollector",
} as const

export type GeneratorId = (typeof GeneratorKey)[keyof typeof GeneratorKey];

export type GeneratorSpec = {
  id: GeneratorId;
  longName: string;
  flavorText: string;
  baseGainPerSec: Cost[];
  baseCost: Cost[];
  growthFactor: number;
  weight: number;
};

export type GeneratorState = {
  id: GeneratorId;
  spec: GeneratorSpec;
  status: ContentStatus;
  amount: number;
  efficiency: number;
};
