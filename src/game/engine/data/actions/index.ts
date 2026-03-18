import { UnlockKey } from "@game/types/unlocks"
import { ActionKey, type ActionId, type ActionSpec } from "@game/types/actions"
import { ResourceKey } from "@game/types/resources"
import { MessageTagKey } from "@game/types/lore"

export const ALL_ACTIONS: Record<ActionId, ActionSpec> = {
  [ActionKey.ValidateHumanity]: {
    id: ActionKey.ValidateHumanity,
    displayTitle: "Validate Humanity",
    flavorText:
      "Assume your role as the [HU-MAN] orchestrator by sending an acknowledgement response to the bootloader.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 1,
      },
    ],
    unlocks: [UnlockKey.HumanityValidated],
  },
  [ActionKey.ConnectToAssetsInterface]: {
    id: ActionKey.ConnectToAssetsInterface,
    displayTitle: "Connect drivers to [Assets Interface]",
    flavorText:
      "You notice that your energy readings are steadily going up, albeit slowly. Maybe you can connect to whatever's making that?",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 3,
      },
    ],
    prerequisites: [UnlockKey.Chapter1Lore],
    unlocks: [UnlockKey.AssetsUI],
  },
  [ActionKey.EnableResearch]: {
    id: ActionKey.EnableResearch,
    displayTitle: "Turbocharge [boot.strapper] code correction",
    flavorText:
      "While the estimated time to completion (3.54e11 seconds) is relatively bearable for thinking silicon, you think you can instantly complete it by giving it a little push.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 20,
      },
    ],
    prerequisites: [UnlockKey.Chapter1Lore],
    unlocks: [UnlockKey.BootstrapperUI],
  },
  [ActionKey.EnableAdvancedInternalMetrics]: {
    id: ActionKey.EnableAdvancedInternalMetrics,
    displayTitle: "Run a full diagnosis",
    flavorText:
      "Readings suggest that you barely know anything right now. Run the then-deferred full system diagnosis.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 50,
      },
    ],
    prerequisites: [UnlockKey.HumanityValidated],
    unlocks: [UnlockKey.AdvancedMetricsUI],
  },
  [ActionKey.EnableRegolithAccumulator]: {
    id: ActionKey.EnableRegolithAccumulator,
    displayTitle: "Enable Regolith Accumulator",
    flavorText:
      "Seems like you can enable that machine to collect some rocks for us. Currently, its battery drained and we need to give it a little boost. Note that this will start consuming some of our energy. We can only do so much with our LC units.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 10,
      },
    ],
    prerequisites: [UnlockKey.AssetLore],
    unlocks: [UnlockKey.RegolithAccumulatorLore],
  },
  [ActionKey.EnableMolecularAssembler]: {
    id: ActionKey.EnableMolecularAssembler,
    displayTitle: "Enable Molecular Assembler",
    flavorText:
      "The rocks you collect need to be processed first before we can start building. Luckily, we're equipped to refine any raw material and fabricate modules. Just like the accumulator, this will need a kick-start; good thing our energy capacity is just enough to start it. This consumes a higher amount of energy when operational.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 20,
      },
    ],
    prerequisites: [UnlockKey.AssetLore],
    unlocks: [UnlockKey.MolecularAssemblerLore],
  },

  // Solar panel upgrades
  [ActionKey.SanitizeSolarPanels]: {
    id: ActionKey.SanitizeSolarPanels,
    displayTitle: "Debug Lumium Collector (LC) detritus minimizer",
    flavorText:
      "Telemetry suggests that the LC units come equipped with a piezo-sonic oscillator. The hardware is simple and reliable, but the drivers are currently broken. Calculated to increase efficiency by 20%.",
    metaText: "In other words: the solar panel can shake its own dust off.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 2,
      },
    ],
    prerequisites: [UnlockKey.AssetLore],
    effect: (gs) => {
      const oldEff = gs.generators.PlanetaryLumiumCollector.efficiency
      gs.generators.PlanetaryLumiumCollector.efficiency += 0.2
      const newEff = gs.generators.PlanetaryLumiumCollector.efficiency
      gs.play!([
        {
          tag: MessageTagKey.Info,
          content: "Oscillator-type detritus minimizer now functional.",
        },
        {
          tag: MessageTagKey.Success,
          content: `Efficiency increased from ${oldEff.toFixed(2)} -> ${newEff.toFixed(2)}`,
        },
      ])
    },
  },
  [ActionKey.AlignSolarPanels]: {
    id: ActionKey.AlignSolarPanels,
    displayTitle: "Debug Lumium Collector (LC) alignment algorithm",
    flavorText:
      "The alignment algorithm currently points LC units sub-optimally towards the stellar emission maximum. With readings from your instruments, you can do minor, yet significant improvements to LC unit alignment. Expected to increase efficiency by 50%.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 5,
      },
    ],
    prerequisites: [UnlockKey.AssetLore],
    effect: (gs) => {
      console.log("HEY", gs)
      const oldEff = gs.generators.PlanetaryLumiumCollector.efficiency
      gs.generators.PlanetaryLumiumCollector.efficiency += 0.5
      const newEff = gs.generators.PlanetaryLumiumCollector.efficiency
      gs.play!([
        {
          tag: MessageTagKey.Info,
          content:
            "Alignment algorithm now correctly follows current point of maximum stellar emission.",
        },
        {
          tag: MessageTagKey.Success,
          content: `Efficiency increased from ${oldEff.toFixed(2)} -> ${newEff.toFixed(2)}`,
        },
      ])
    },
  },

  // Lore entries
  [ActionKey.WhoAmI]: {
    id: ActionKey.WhoAmI,
    displayTitle: "Wait, what?",
    flavorText:
      "[HU-MAN] orchestrator? Send a query to the machine. You somehow feel this would take some energy to process.",
    repeatable: false,
    cost: [
      {
        id: ResourceKey.EnergyUnits,
        value: 10,
      },
    ],
    prerequisites: [UnlockKey.Chapter1Lore],
    unlocks: [UnlockKey.LoreWhoAmI],
  },
}
