export const UnlockKey = {
  IntroductionFinished: 0,
  ActionsUI: 1,
  HumanityValidated: 2,
  StorageUI: 3,
  BootstrapperUI: 4,
  SettingsUI: 5,

  Chapter1Lore: 9000,
  LoreWhoAmI: 10000,
} as const

export type UnlockId = (typeof UnlockKey)[keyof typeof UnlockKey];
