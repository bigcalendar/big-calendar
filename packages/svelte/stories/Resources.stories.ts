import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { fn } from 'storybook/test'
import ResourcesCalendarStory from './ResourcesCalendarStory.svelte'

type ResourceArgs = {
  layout: 'day' | 'week' | 'week-day-major'
  onRangeChange: (a: unknown) => void
  onEventDrop: (a: unknown) => void
  onEventResize: (a: unknown) => void
}

const meta: Meta = {
  title: 'Resources/With Resources',
  args: {
    onRangeChange: fn(),
    onEventDrop: fn(),
    onEventResize: fn(),
  },
}
export default meta

/**
 * Resource calendar with six meeting rooms. Events are assigned to rooms via
 * the `resourceId` field and the default `resource` accessor. Drag and resize
 * are fully enabled — dropping into a different room column updates `resourceId`.
 *
 * Use the **Controls** panel to switch between **week** (days are columns,
 * resources share each day), **day** (resources are columns within a single day),
 * and **week-day-major** (resources are the primary columns, days within each
 * resource).
 */
export const WithResources: StoryObj<ResourceArgs> = {
  args: { layout: 'week' },
  argTypes: {
    layout: {
      control: 'select',
      options: ['week', 'day', 'week-day-major'],
      description:
        '`week` — days as outer columns, resources share each day. `day` — resources as columns in a single-day view. `week-day-major` — resources as outer columns, days within each resource.',
    },
  },
  render: (args) => ({
    Component: ResourcesCalendarStory,
    props: args,
  }),
}
