import { type ContentStatus } from "./shared"
import { type UnlockId } from "./unlocks"

export const ResourceKey = {
  Regolith: "rocks",
  UniversalStructuralMaterial: "USM",
  EnergyUnits: "EU",
} as const

export type ResourceId = (typeof ResourceKey)[keyof typeof ResourceKey];

export type Cost = {
  id: ResourceId;
  value: number;
};

export type ResourceSpec = {
  id: ResourceId;
  longName: string;
  unit: string;
  display: "main" | "others";
  prerequisites: UnlockId[];
};

export type ResourceState = {
  spec: ResourceSpec;
  amount: number;
  cap: number;
  status: ContentStatus;
};

export type ResourceStateLookup = Record<ResourceId, ResourceState>;
