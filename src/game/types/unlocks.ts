export const UnlockKey = {
  IntroductionFinished: 0,
  ActionsUI: 1,
  HumanityValidated: 2,
  StorageUI: 3,
  BootstrapperUI: 4,
  SettingsUI: 5,
} as const

export type UnlockId = (typeof UnlockKey)[keyof typeof UnlockKey];
