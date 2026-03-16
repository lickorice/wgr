export const ContentStatusKey = {
  Locked: 0,
  Unlocked: 1,
  Completed: 2,
} as const

export type ContentStatus =
  (typeof ContentStatusKey)[keyof typeof ContentStatusKey];
