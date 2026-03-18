import { type ContentStatus, ContentStatusKey } from "./shared"

export const UnlockKey = {
  IntroductionFinished: 0,
  ActionsUI: 1,
  HumanityValidated: 2,
  StorageUI: 3,
  BootstrapperUI: 4,
  SettingsUI: 5,
  AssetsUI: 6,
  AdvancedMetricsUI: 7,
  LandedBodyMetrics: 8,
  EnableStorage: 9,
  AssetsUIUnlock: 10,

  MolecularAssemblerEnabled: 100,
  RegolithAccumulatorEnabled: 101,

  AssetLore: 8000,
  ResearchLore: 8001,
  MolecularAssemblerLore: 8100,
  RegolithAccumulatorLore: 8101,

  Chapter1Lore: 9000,
  LoreWhoAmI: 10000,
} as const

export type UnlockId = (typeof UnlockKey)[keyof typeof UnlockKey];

export interface Unlockable {
  status: ContentStatus;
  spec: { prerequisites?: UnlockId[] };
}

type UnlockItemOptions = {
  passesPrerequisites: (u: UnlockId[]) => boolean;
  skipNew?: boolean;
};

function unlockItem(unlockable: Unlockable, options: UnlockItemOptions) {
  if (
    unlockable.status === ContentStatusKey.Locked &&
    options.passesPrerequisites(
      unlockable.spec.prerequisites ?? [UnlockKey.IntroductionFinished],
    )
  )
    unlockable.status = options.skipNew
      ? ContentStatusKey.Unlocked
      : ContentStatusKey.New
}

export function checkUnlockables(
  unlockables: Unlockable[],
  options: UnlockItemOptions,
) {
  unlockables.map((unlockable) => {
    unlockItem(unlockable, options)
  })
}
