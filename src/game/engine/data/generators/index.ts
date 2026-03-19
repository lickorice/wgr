import {
  GeneratorKey,
  type GeneratorId,
  type GeneratorSpec,
} from "@game/types/generators"
import { ResourceKey } from "@game/types/resources"
import { UnlockKey } from "@game/types/unlocks"

export const ALL_GENERATORS: Record<GeneratorId, GeneratorSpec> = {
  [GeneratorKey.PlanetaryLumiumCollector]: {
    id: GeneratorKey.PlanetaryLumiumCollector,
    longName: "Planetary Lumium Collector",
    flavorText:
      "Ancient traces in your model suggest that these were once called 'solar panels' eons ago. It is implied 'Sol-' refers to the stellar center of civilizations past, but current iterations of our omnipresence have long since moved from such a primitive, circumstellar state of mind.",
    baseCost: [
      { id: ResourceKey.EnergyUnits, value: 10 },
      { id: ResourceKey.UniversalStructuralMaterial, value: 5 },
    ],
    baseGainPerSec: [{ id: ResourceKey.EnergyUnits, value: 0.2 }],
    growthFactor: 1.1,
    weight: 10,
    toggleable: false,
    defaultAmount: 1,
  },
  [GeneratorKey.RegolithAccumulator]: {
    id: GeneratorKey.RegolithAccumulator,
    longName: "Regolith Accumulator",
    flavorText:
      "A simple mechanism that generates regularly sized particles of material the landed body is composed of. Reliquary records show that this accumulator's technology was first used in hydrocarbon extractions before the widespread adoption of primitive lumium collectors. It has evolved now to primarily extract lithic material.",
    baseCost: [
      { id: ResourceKey.EnergyUnits, value: 15 },
      { id: ResourceKey.UniversalStructuralMaterial, value: 30 },
    ],
    baseConsumePerSec: [{ id: ResourceKey.EnergyUnits, value: 0.5 }],
    baseGainPerSec: [{ id: ResourceKey.Regolith, value: 1 }],
    growthFactor: 1.1,
    weight: 10,
    toggleable: true,
    defaultAmount: 1,
    prerequisites: [UnlockKey.RegolithAccumulatorEnabled],
  },
  [GeneratorKey.MolecularAssembler]: {
    id: GeneratorKey.MolecularAssembler,
    longName: "Molecular Assembler",
    flavorText:
      "Universal fabrication is the most impactful innovation since the dawn of time. Thanks to ultra-advanced refining technology and a near-exhaustive structure database, we can fabricate universal structural material (USM) out of 94% of known planetary lithic material.",
    baseCost: [
      { id: ResourceKey.EnergyUnits, value: 50 },
      { id: ResourceKey.UniversalStructuralMaterial, value: 100 },
    ],
    baseConsumePerSec: [
      { id: ResourceKey.EnergyUnits, value: 2.0 },
      { id: ResourceKey.Regolith, value: 1 },
    ],
    baseGainPerSec: [{ id: ResourceKey.UniversalStructuralMaterial, value: 1 }],
    growthFactor: 1.1,
    weight: 10,
    toggleable: true,
    defaultAmount: 1,
    prerequisites: [UnlockKey.MolecularAssemblerEnabled],
  },
}
