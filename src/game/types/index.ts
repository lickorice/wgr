import { type AssetSpec } from "./assets"
import { type ActionSpec } from "./actions"
import { type ResourceSpec } from "./resources"
import { type GameSetting } from "./settings"

export interface HasSpec {
  spec: AssetSpec | ActionSpec | ResourceSpec | GameSetting;
}
