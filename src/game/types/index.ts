import { type GeneratorSpec } from "./generators"
import { type ActionSpec } from "./actions"
import { type ResourceSpec } from "./resources"
import { type GameSetting } from "./settings"

export interface HasSpec {
  spec: GeneratorSpec | ActionSpec | ResourceSpec | GameSetting;
}
