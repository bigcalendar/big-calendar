import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import DropFromOutsideStory from './DropFromOutsideStory.svelte'

type DropArgs = {
  view: ViewKey
  onRangeChange: (a: unknown) => void
  onDropFromOutside: (a: unknown) => void
}

const meta: Meta = {
  title: 'Drag & Drop/Drop from Outside',
  args: {
    onRangeChange: fn(),
    onDropFromOutside: fn(),
  },
}
export default meta

/**
 * Drag items from the sidebar palette onto the calendar to create new events.
 * Each palette chip carries a payload via the `EXTERNAL_MIME` data-transfer key
 * (`application/x-big-calendar-external`).
 *
 * Items with `durationMinutes` create a timed event of that length. Items with
 * explicit `start`/`end` strings use those times (re-dated to the drop target's
 * day). Items with an empty payload become all-day events.
 *
 * Switch views in the **Controls** panel to test month, week, and day-view drops.
 */
export const DropFromOutside: StoryObj<DropArgs> = {
  args: { view: Views.WEEK },
  argTypes: {
    view: {
      control: 'select',
      options: [Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY],
      description: 'Calendar view to drop onto.',
    },
  },
  render: (args) => ({
    Component: DropFromOutsideStory,
    props: args,
  }),
}
