import type { ActionId, ActionStateLookup } from "@game/types/actions"
import type { AssetStateLookup } from "@src/game/types/assets"
import type { SettingsId, GameSettingStateLookup } from "@game/types/settings"
import type { Cost, ResourceStateLookup } from "@game/types/resources"
import type { ChapterId, Message } from "@game/types/lore"
import type { UnlockId } from "@game/types/unlocks"

export const ContentStatusKey = {
  Locked: 0,
  New: 1,
  Unlocked: 2,
  Completed: 3,
} as const

export type ContentStatus =
  (typeof ContentStatusKey)[keyof typeof ContentStatusKey];

// Unified helper interface used throughout the UI and sub-engines.
// This consolidates the multiple local `Helpers`/`LoreEngineHelpers` types
// that previously existed in various layout files.
export type GameEngineHelper = {
  // Accessors
  getAssets: () => AssetStateLookup;
  getActions: () => ActionStateLookup;
  getResources: () => ResourceStateLookup;
  getGameSettings: () => GameSettingStateLookup;

  // Updaters / registration
  registerUpdater: (fn: (snapshot: unknown) => void) => void;
  registerFastUpdater: (fn: (snapshot: unknown) => void) => void;

  // Game actions
  affordCost: (cost: Cost[]) => boolean;
  deductCost: (cost: Cost[]) => void;
  addCost: (cost: Cost[]) => void;
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
