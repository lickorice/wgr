import {
  GeneratorKey,
  type GeneratorId,
  type GeneratorSpec,
} from "@game/types/generators"
import { ResourceKey } from "@game/types/resources"

export const ALL_GENERATORS: Record<GeneratorId, GeneratorSpec> = {
  [GeneratorKey.PlanetaryLumiumCollector]: {
    id: GeneratorKey.PlanetaryLumiumCollector,
    longName: "Planetary Lumium Collector",
    flavorText:
      "Ancient traces in your model suggest that these were once called 'solar panels' eons ago. It is implied 'Sol-' refers to the stellar center of civilizations past, but current iterations of our omnipresence have long since moved from such a primitive, circumstellar state of mind.",
    baseCost: [
      { id: ResourceKey.EnergyUnits, value: 20 },
      { id: ResourceKey.UniversalStructuralMaterial, value: 10 },
    ],
    baseGainPerSec: [{ id: ResourceKey.EnergyUnits, value: 0.2 }],
    growthFactor: 1.1,
    weight: 10,
  },
}
