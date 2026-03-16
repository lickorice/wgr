import { type Cost } from "./resources"
import { type UnlockId } from "./unlocks"
import { type ContentStatus } from "./shared"

import { type GameSnapshot } from "@game/engine/game_engine"

export const ActionKey = {
  ValidateHumanity: 0,
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
};

export type ActionState = {
  id: ActionId;
  spec: ActionSpec;
  status: ContentStatus;
  boughtCount?: number;
  cap?: number;
  element?: HTMLElement;
};
