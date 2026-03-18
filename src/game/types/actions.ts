import { type Cost } from "./resources"
import { type UnlockId } from "./unlocks"
import { type ContentStatus } from "./shared"

import { type GameSnapshot } from "@game/engine/game_engine"

export const ActionKey = {
  ValidateHumanity: 0,
  //   LowPowerDiagnostics: 1,
  ConnectToAssetsInterface: 2,
  //   EnableStorageExpansion: 3,
  EnableResearch: 4,
  EnableAdvancedInternalMetrics: 5,
  //   EnableLandedBodyMetrics: 6,
  EnableRegolithAccumulator: 7,
  EnableMolecularAssembler: 8,

  // Solar panel upgrades
  SanitizeSolarPanels: 100,
  AlignSolarPanels: 101,
  WhoAmI: 10000,
} as const

export type ActionId = (typeof ActionKey)[keyof typeof ActionKey];

export type ActionSpec = {
  id: ActionId;
  repeatable: boolean;
  displayTitle: string;
  flavorText: string;
  cost: Cost[];
  // Will always wait for IntroductionFinished, regardless if this is defined.
  prerequisites?: UnlockId[];
  // Shorthand for UnlockId unlocks, no need to implement custom effect
  unlocks?: UnlockId[];
  // Custom effects that pass in a GameSnapshot
  effect?: (game_snapshot: GameSnapshot) => void;
  // Developer notes hehe
  metaText?: string;
};

export type ActionState = {
  id: ActionId;
  spec: ActionSpec;
  status: ContentStatus;
  boughtCount?: number;
  cap?: number;
  element?: HTMLElement;
};

export type ActionStateLookup = Record<ActionId, ActionState>;
