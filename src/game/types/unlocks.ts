export const UnlockKey = {
  IntroductionFinished: 0,
  ActionsUI: 1,
} as const

export type UnlockId = (typeof UnlockKey)[keyof typeof UnlockKey];
