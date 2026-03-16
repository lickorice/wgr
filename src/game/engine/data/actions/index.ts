import { UnlockKey } from "@game/types/unlocks"
import { ActionKey, type ActionId, type ActionSpec } from "@game/types/actions"
import { ResourceKey } from "@game/types/resources"

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
