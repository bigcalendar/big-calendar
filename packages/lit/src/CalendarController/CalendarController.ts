import type { ReactiveControllerHost } from 'lit'
import { createCalendarStore, resolveMessages } from '@big-calendar/core'
import type {
  Accessors,
  CalendarStore,
  DayLayoutAlgorithm,
  DayLayoutAlgorithmKey,
  EventId,
  GetDrilldownView,
  LocalizerContract,
  Messages,
  PlainTimeInput,
  ResourceId,
  ResourceLayoutMode,
  SelectableMode,
  SlotSelectionDates,
  ViewKey,
  ViewRegistry,
} from '@big-calendar/core'

export interface CalendarConfig<TEvent = unknown, TResource = unknown> {
  localizer: LocalizerContract
  events?: TEvent[]
  backgroundEvents?: TEvent[]
  resources?: TResource[]
  view?: ViewKey
  date?: string
  defaultView?: ViewKey
  defaultDate?: string
  views?: ViewKey[]
  viewDefinitions?: ViewRegistry<TEvent, TResource>
  accessors?: Partial<Accessors<TEvent, TResource>>
  getNow?: () => string
  length?: number
  step?: number
  timeslots?: number
  min?: PlainTimeInput
  max?: PlainTimeInput
  scrollToTime?: PlainTimeInput
  dayLayoutAlgorithm?: DayLayoutAlgorithmKey | DayLayoutAlgorithm
  weekEventLimit?: number
  showMultiDayTimes?: boolean
  resourceLayout?: ResourceLayoutMode
  showAllEvents?: boolean
  selectable?: SelectableMode
  longPressThreshold?: number
  drilldownView?: ViewKey | null
  getDrilldownView?: GetDrilldownView
  messages?: Partial<Messages>
  onNavigate?: (args: { date: string; view: ViewKey }) => void
  onView?: (args: { view: ViewKey }) => void
  onEventClick?: (event: TEvent, domEvent: MouseEvent | KeyboardEvent) => void
  onEventDoubleClick?: (event: TEvent, domEvent: MouseEvent | KeyboardEvent) => void
  onEventRightClick?: (event: TEvent, domEvent: MouseEvent) => void
  onEventMiddleClick?: (event: TEvent, domEvent: MouseEvent) => void
  onEventSelect?: (args: { id: EventId | null }) => void
  onEventDrop?: (args: {
    event: TEvent
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: TEvent[]
  }) => void
  onEventResize?: (args: {
    event: TEvent
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: TEvent[]
  }) => void
  onDropFromOutside?: (args: {
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: TEvent[]
  }) => void
  onEventDragStart?: (args: { event: TEvent }) => void
  onSlotSelecting?: (args: {
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: TEvent[]
  }) => boolean | void
  onSlotClick?: (selection: SlotSelectionDates<TEvent>) => void
  onSlotDoubleClick?: (selection: SlotSelectionDates<TEvent>) => void
  onSlotSelect?: (selection: SlotSelectionDates<TEvent>) => void
  onRangeChange?: (args: { range: { start: string; end: string }; view: ViewKey }) => void
  onDrillDown?: (args: { date: string; view: ViewKey }) => void
}

let _nextId = 0

export class CalendarController<TEvent = unknown, TResource = unknown> {
  private _store: CalendarStore<TEvent, TResource> | null = null
  readonly descriptionIds: { selection: string; event: string }

  constructor(
    private readonly host: ReactiveControllerHost,
    public config: CalendarConfig<TEvent, TResource>,
  ) {
    const id = `bc-cc-${++_nextId}-`
    this.descriptionIds = { selection: `${id}selection`, event: `${id}event` }
    host.addController(this)
  }

  get store(): CalendarStore<TEvent, TResource> {
    return this._store!
  }

  get messages(): Messages {
    return resolveMessages(this.config.messages)
  }

  hostConnected(): void {
    this._createStore()
  }

  hostDisconnected(): void {
    this._cleanup()
  }

  updateConfig(updates: Partial<CalendarConfig<TEvent, TResource>>): void {
    Object.assign(this.config, updates)
    if (!this._store) return
    const store = this._store
    if (updates.events !== undefined) store.events.value = updates.events as unknown as TEvent[]
    if (updates.backgroundEvents !== undefined) store.backgroundEvents.value = updates.backgroundEvents as unknown as TEvent[]
    if (updates.resources !== undefined) store.resources.value = updates.resources as unknown as TResource[]
    if (updates.view !== undefined) store.view.value = updates.view
    if (updates.date !== undefined) store.date.value = updates.date
    if (updates.localizer !== undefined) store.setLocalizer({ localizer: updates.localizer })
    if (updates.dayLayoutAlgorithm !== undefined) store.dayLayoutAlgorithm.value = updates.dayLayoutAlgorithm
  }

  recreateStore(): void {
    this._cleanup()
    this._createStore()
  }

  private _createStore(): void {
    if (!this.config.localizer) return
    const c = this.config
    this._store = createCalendarStore({
      localizer: c.localizer,
      events: (c.events ?? []) as unknown[],
      backgroundEvents: (c.backgroundEvents ?? []) as unknown[],
      resources: c.resources as unknown[] | undefined,
      view: c.view ?? c.defaultView,
      date: c.date ?? c.defaultDate,
      enabledViews: c.views,
      viewDefinitions: c.viewDefinitions as ViewRegistry<unknown, unknown> | undefined,
      accessors: c.accessors as Partial<Accessors<unknown, unknown>> | undefined,
      getNow: c.getNow,
      length: c.length,
      step: c.step,
      timeslots: c.timeslots,
      min: c.min,
      max: c.max,
      scrollToTime: c.scrollToTime,
      dayLayoutAlgorithm: c.dayLayoutAlgorithm,
      weekEventLimit: c.weekEventLimit,
      showMultiDayTimes: c.showMultiDayTimes,
      resourceLayout: c.resourceLayout,
      showAllEvents: c.showAllEvents,
      selectable: c.selectable,
      longPressThreshold: c.longPressThreshold,
      drilldownView: c.drilldownView,
      getDrilldownView: c.getDrilldownView,
      onNavigate: (args) => this.config.onNavigate?.(args),
      onView: (args) => this.config.onView?.(args),
      onEventSelect: (args) => this.config.onEventSelect?.(args),
      onDrillDown: (args) => this.config.onDrillDown?.(args),
      onEventClick: (e, de) => this.config.onEventClick?.(e as TEvent, de),
      onEventDoubleClick: (e, de) => this.config.onEventDoubleClick?.(e as TEvent, de),
      onEventRightClick: (e, de) => this.config.onEventRightClick?.(e as TEvent, de as MouseEvent),
      onEventMiddleClick: (e, de) => this.config.onEventMiddleClick?.(e as TEvent, de as MouseEvent),
      onEventDrop: (args) => this.config.onEventDrop?.(args as Parameters<NonNullable<CalendarConfig<TEvent, TResource>['onEventDrop']>>[0]),
      onEventResize: (args) => this.config.onEventResize?.(args as Parameters<NonNullable<CalendarConfig<TEvent, TResource>['onEventResize']>>[0]),
      onDropFromOutside: (args) => this.config.onDropFromOutside?.(args as Parameters<NonNullable<CalendarConfig<TEvent, TResource>['onDropFromOutside']>>[0]),
      onEventDragStart: (args) => this.config.onEventDragStart?.(args as Parameters<NonNullable<CalendarConfig<TEvent, TResource>['onEventDragStart']>>[0]),
      onSlotSelecting: (args) => this.config.onSlotSelecting?.(args as Parameters<NonNullable<CalendarConfig<TEvent, TResource>['onSlotSelecting']>>[0]),
      onSlotClick: (args) => this.config.onSlotClick?.(args as SlotSelectionDates<TEvent>),
      onSlotDoubleClick: (args) => this.config.onSlotDoubleClick?.(args as SlotSelectionDates<TEvent>),
      onSlotSelect: (args) => this.config.onSlotSelect?.(args as SlotSelectionDates<TEvent>),
      onRangeChange: (args) => this.config.onRangeChange?.(args),
    }) as unknown as CalendarStore<TEvent, TResource>
    this.host.requestUpdate()
  }

  private _cleanup(): void {
    this._store?.destroy()
    this._store = null
  }
}
