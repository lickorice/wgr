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

  Chapter1Lore: 9000,
  LoreWhoAmI: 10000,
} as const

export type UnlockId = (typeof UnlockKey)[keyof typeof UnlockKey];
