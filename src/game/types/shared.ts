import type { ActionId, ActionState } from "@game/types/actions"
import type { GeneratorId, GeneratorState } from "@game/types/generators"
import type { SettingsId, GameSettingState } from "@game/types/settings"
import type { Cost } from "@game/types/resources"
import type { ChapterId, Message } from "@game/types/lore"
import type { UnlockId } from "@game/types/unlocks"

export const ContentStatusKey = {
  Locked: 0,
  Unlocked: 1,
  Completed: 2,
} as const

export type ContentStatus =
  (typeof ContentStatusKey)[keyof typeof ContentStatusKey];

// Unified helper interface used throughout the UI and sub-engines.
// This consolidates the multiple local `Helpers`/`LoreEngineHelpers` types
// that previously existed in various layout files.
export type GameEngineHelper = {
  // Accessors
  getGenerators: () => Record<GeneratorId, GeneratorState>;
  getActions: () => Record<ActionId, ActionState>;
  getGameSettings: () => Record<SettingsId, GameSettingState>;

  // Updaters / registration
  registerUpdater: (fn: (snapshot: unknown) => void) => void;

  // Game actions
  affordCost: (cost: Cost[]) => boolean;
  performAction: (id: ActionId) => void;

  // Save / load / autosave
  exportSave: () => string;
  importSave: (s: string) => void;
  doAutosave: () => void;

  // Lore / playback
  play: (id: ChapterId | Message[]) => void;

  // Settings
  setGameSettingValue: (id: SettingsId, value: unknown) => void;

  // Unlocks
  unlock: (toUnlock: UnlockId) => void;
};
