import type { LocalizerContract } from '@big-calendar/localizer'
import { createContext, useContext } from 'react'

/**
 * Provides the active {@link LocalizerContract} created by
 * {@link withLocalizerDecorator} to any component inside the story tree.
 * `null` when rendered outside of a Storybook decorator context.
 */
export const LocalizerContext = createContext<LocalizerContract | null>(null)

/** Returns the localizer provided by {@link withLocalizerDecorator}, or `null`. */
export function useLocalizerContext(): LocalizerContract | null {
  return useContext(LocalizerContext)
}
