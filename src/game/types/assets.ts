import { type ContentStatus } from "./shared"
import { type Cost } from "./resources"
import { type UnlockId } from "./unlocks"

export const AssetKey = {
  PlanetaryLumiumCollector: "PlanetaryLumiumCollector",
  RegolithAccumulator: "RegolithAccumulator",
  MolecularAssembler: "MolecularAssembler",
} as const

export type AssetId = (typeof AssetKey)[keyof typeof AssetKey];

export type AssetSpec = {
  id: AssetId;
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

export type AssetState = {
  id: AssetId;
  spec: AssetSpec;
  status: ContentStatus;
  amount: number;
  efficiency: number;
  toggled?: number;
  element?: HTMLElement;
};

export type AssetStateLookup = Record<AssetId, AssetState>;
