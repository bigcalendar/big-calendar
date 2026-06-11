import { Views } from '@big-calendar/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useAgendaView, Toolbar } from '../src'
import { CalendarStage } from './harness'

/**
 * A custom agenda view written entirely with `useAgendaView`. The hook returns
 * all the data and element-spread props needed — this component is a near-pure
 * render function on top of them. This is how `AgendaView` itself is built.
 */
function CustomAgendaView<TEvent = unknown>() {
  const { rows, components, messages, root, header, headingCell, body, getRowProps } = useAgendaView<TEvent>()

  if (rows === null) return null

  const { DateSlot, EventSlot, EmptySlot } = components

  return (
    <div {...root}>
      <div {...header}>
        <span {...headingCell}>{messages.date}</span>
        <span {...headingCell}>{messages.time}</span>
        <span {...headingCell}>{messages.event}</span>
      </div>
      {rows.length === 0 ? (
        <EmptySlot message={messages.noEventsInRange} />
      ) : (
        <div {...body}>
          {rows.map((row) => (
            <div key={row.day} {...getRowProps(row)}>
              <DateSlot day={row.day} label={row.label} />
              {row.events.map((item) => (
                <EventSlot
                  key={item.key}
                  event={item.event}
                  title={item.title}
                  time={item.time}
                  allDay={item.allDay}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const meta: Meta = {
  title: 'React/Hooks/useAgendaView',
  parameters: {
    docs: {
      description: {
        component:
          'Composes all data and element-spread props for a custom agenda view. The hook handles row calculation, component slot resolution, and message resolution — your component just renders.',
      },
    },
  },
}
export default meta

type Story = StoryObj

/**
 * `CustomAgendaView` is a complete agenda view implemented entirely with
 * `useAgendaView`. The built-in `AgendaView` component is just this hook plus
 * the same render function — you can copy it and change any part.
 */
export const Default: Story = {
  render: () => (
    <CalendarStage defaultView={Views.AGENDA} views={[Views.AGENDA]}>
      <Toolbar />
      <div className="bc-calendar">
        <CustomAgendaView />
      </div>
    </CalendarStage>
  ),
}
