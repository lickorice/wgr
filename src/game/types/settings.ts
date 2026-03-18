import { type UnlockId } from "./unlocks"
import { type ContentStatus } from "./shared"

export const SettingsKey = {
  PlayMetaMessages: "PlayMetaMessages",
  PlayAutosaveMessages: "PlayAutosaveMessages",
  AutosaveInterval: "AutosaveInterval",
  UseSansSerifDescriptions: "UseSansSerifDescriptions",
} as const

export type SettingsId = (typeof SettingsKey)[keyof typeof SettingsKey];

type AllowedValue = string | number | boolean;
type AllowedValueTypeStr = "string" | "number" | "boolean";

export type GameSetting = {
  id: SettingsId;
  defaultValue: AllowedValue;
  type: AllowedValueTypeStr;
  prerequisites?: UnlockId[];
  longName: string;
  helperText: string;
};

export type GameSettingState = {
  id: SettingsId;
  spec: GameSetting;
  value: AllowedValue;
  status: ContentStatus;
};

export type GameSettingStateLookup = Record<SettingsId, GameSettingState>;
