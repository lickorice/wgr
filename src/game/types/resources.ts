export const ResourceKey = {
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
};

export type ResourceState = {
  spec: ResourceSpec;
  amount: number;
  cap: number;
};

export type ResourceStateLookup = Record<ResourceId, ResourceState>;
