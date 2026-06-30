import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ContextProvider } from '@lit/context'
import type {
  Accessors,
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
import { CalendarController } from '../CalendarController/CalendarController'
import type { CalendarConfig } from '../CalendarController/CalendarController'
import { calendarContext } from '../CalendarController/calendarContext'

@customElement('bc-calendar')
export class CalendarElement extends LitElement {
  override createRenderRoot() {
    return this
  }

  // ---- Required -------------------------------------------------------
  @property({ attribute: false }) localizer!: LocalizerContract

  // ---- Data -----------------------------------------------------------
  @property({ attribute: false }) events?: unknown[]
  @property({ attribute: false }) backgroundEvents?: unknown[]
  @property({ attribute: false }) resources?: unknown[]

  // ---- View control ---------------------------------------------------
  @property({ attribute: false }) view?: ViewKey
  @property({ attribute: false }) date?: string
  @property({ attribute: 'default-view' }) defaultView?: ViewKey
  @property({ attribute: 'default-date' }) defaultDate?: string
  @property({ attribute: false }) views?: ViewKey[]

  // ---- Static config --------------------------------------------------
  @property({ attribute: false }) viewDefinitions?: ViewRegistry<unknown, unknown>
  @property({ attribute: false }) accessors?: Partial<Accessors<unknown, unknown>>
  @property({ attribute: false }) getNow?: () => string
  @property({ type: Number }) length?: number
  @property({ type: Number }) step?: number
  @property({ type: Number }) timeslots?: number
  @property({ attribute: false }) min?: PlainTimeInput
  @property({ attribute: false }) max?: PlainTimeInput
  @property({ attribute: false }) scrollToTime?: PlainTimeInput
  @property({ attribute: false }) dayLayoutAlgorithm?: DayLayoutAlgorithmKey | DayLayoutAlgorithm
  @property({ type: Number, attribute: 'week-event-limit' }) weekEventLimit?: number
  @property({ type: Boolean, attribute: 'show-multi-day-times' }) showMultiDayTimes?: boolean
  @property({ attribute: false }) resourceLayout?: ResourceLayoutMode
  @property({ type: Boolean, attribute: 'show-all-events' }) showAllEvents?: boolean
  @property({ attribute: false }) selectable?: SelectableMode
  @property({ type: Number, attribute: 'long-press-threshold' }) longPressThreshold?: number
  @property({ attribute: false }) drilldownView?: ViewKey | null
  @property({ attribute: false }) getDrilldownView?: GetDrilldownView
  @property({ attribute: false }) messages?: Partial<Messages>

  // ---- Callbacks ------------------------------------------------------
  @property({ attribute: false }) onNavigate?: (args: { date: string; view: ViewKey }) => void
  @property({ attribute: false }) onView?: (args: { view: ViewKey }) => void
  @property({ attribute: false }) onEventClick?: (event: unknown, domEvent: MouseEvent | KeyboardEvent) => void
  @property({ attribute: false }) onEventDoubleClick?: (event: unknown, domEvent: MouseEvent | KeyboardEvent) => void
  @property({ attribute: false }) onEventRightClick?: (event: unknown, domEvent: MouseEvent) => void
  @property({ attribute: false }) onEventMiddleClick?: (event: unknown, domEvent: MouseEvent) => void
  @property({ attribute: false }) onEventSelect?: (args: { id: EventId | null }) => void
  @property({ attribute: false }) onEventDrop?: (args: {
    event: unknown
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: unknown[]
  }) => void
  @property({ attribute: false }) onEventResize?: (args: {
    event: unknown
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: unknown[]
  }) => void
  @property({ attribute: false }) onDropFromOutside?: (args: {
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: unknown[]
  }) => void
  @property({ attribute: false }) onEventDragStart?: (args: { event: unknown }) => void
  @property({ attribute: false }) onSlotSelecting?: (args: {
    start: string
    end: string
    allDay: boolean
    resourceId?: ResourceId
    backgroundEvents?: unknown[]
  }) => boolean | void
  @property({ attribute: false }) onSlotClick?: (selection: SlotSelectionDates<unknown>) => void
  @property({ attribute: false }) onSlotDoubleClick?: (selection: SlotSelectionDates<unknown>) => void
  @property({ attribute: false }) onSlotSelect?: (selection: SlotSelectionDates<unknown>) => void
  @property({ attribute: false }) onRangeChange?: (args: { range: { start: string; end: string }; view: ViewKey }) => void
  @property({ attribute: false }) onDrillDown?: (args: { date: string; view: ViewKey }) => void

  private _controller!: CalendarController
  private _provider!: ContextProvider<typeof calendarContext>

  override connectedCallback(): void {
    this._initController()
    super.connectedCallback()
  }

  private _initController(): void {
    const config = this._buildConfig()
    this._controller = new CalendarController(this, config)
    // Provider must be created before super.connectedCallback() so children
    // receive context when they connect.
    this._provider = new ContextProvider(this, {
      context: calendarContext,
      initialValue: {
        store: null as never, // store is set after hostConnected
        messages: this._controller.messages,
        descriptionIds: this._controller.descriptionIds,
      },
    })
  }

  override updated(changed: Map<string | number | symbol, unknown>): void {
    super.updated(changed)
    if (!this._controller) return

    const localizerChanged = changed.has('localizer')
    if (localizerChanged) {
      // localizer change requires full store re-creation
      this._controller.config = this._buildConfig()
      this._controller.recreateStore()
    } else {
      // incremental updates — only set keys that are defined (exactOptionalPropertyTypes)
      const updates: Partial<CalendarConfig> = {
        ...(changed.has('events') && this.events !== undefined && { events: this.events }),
        ...(changed.has('backgroundEvents') && this.backgroundEvents !== undefined && { backgroundEvents: this.backgroundEvents }),
        ...(changed.has('resources') && this.resources !== undefined && { resources: this.resources }),
        ...(changed.has('view') && this.view !== undefined && { view: this.view }),
        ...(changed.has('date') && this.date !== undefined && { date: this.date }),
        ...(changed.has('dayLayoutAlgorithm') && this.dayLayoutAlgorithm !== undefined && { dayLayoutAlgorithm: this.dayLayoutAlgorithm }),
      }
      if (Object.keys(updates).length > 0) this._controller.updateConfig(updates)
    }

    // Always sync the context value once store exists
    if (this._controller.store) {
      this._provider.setValue({
        store: this._controller.store,
        messages: this._controller.messages,
        descriptionIds: this._controller.descriptionIds,
      })
    }
  }

  private _buildConfig(): CalendarConfig {
    return {
      localizer: this.localizer,
      ...(this.events !== undefined && { events: this.events }),
      ...(this.backgroundEvents !== undefined && { backgroundEvents: this.backgroundEvents }),
      ...(this.resources !== undefined && { resources: this.resources }),
      ...(this.view !== undefined && { view: this.view }),
      ...(this.date !== undefined && { date: this.date }),
      ...(this.defaultView !== undefined && { defaultView: this.defaultView }),
      ...(this.defaultDate !== undefined && { defaultDate: this.defaultDate }),
      ...(this.views !== undefined && { views: this.views }),
      ...(this.viewDefinitions !== undefined && { viewDefinitions: this.viewDefinitions }),
      ...(this.accessors !== undefined && { accessors: this.accessors }),
      ...(this.getNow !== undefined && { getNow: this.getNow }),
      ...(this.length !== undefined && { length: this.length }),
      ...(this.step !== undefined && { step: this.step }),
      ...(this.timeslots !== undefined && { timeslots: this.timeslots }),
      ...(this.min !== undefined && { min: this.min }),
      ...(this.max !== undefined && { max: this.max }),
      ...(this.scrollToTime !== undefined && { scrollToTime: this.scrollToTime }),
      ...(this.dayLayoutAlgorithm !== undefined && { dayLayoutAlgorithm: this.dayLayoutAlgorithm }),
      ...(this.weekEventLimit !== undefined && { weekEventLimit: this.weekEventLimit }),
      ...(this.showMultiDayTimes !== undefined && { showMultiDayTimes: this.showMultiDayTimes }),
      ...(this.resourceLayout !== undefined && { resourceLayout: this.resourceLayout }),
      ...(this.showAllEvents !== undefined && { showAllEvents: this.showAllEvents }),
      ...(this.selectable !== undefined && { selectable: this.selectable }),
      ...(this.longPressThreshold !== undefined && { longPressThreshold: this.longPressThreshold }),
      ...(this.drilldownView !== undefined && { drilldownView: this.drilldownView }),
      ...(this.getDrilldownView !== undefined && { getDrilldownView: this.getDrilldownView }),
      ...(this.messages !== undefined && { messages: this.messages }),
      ...(this.onNavigate !== undefined && { onNavigate: this.onNavigate }),
      ...(this.onView !== undefined && { onView: this.onView }),
      ...(this.onEventClick !== undefined && { onEventClick: this.onEventClick }),
      ...(this.onEventDoubleClick !== undefined && { onEventDoubleClick: this.onEventDoubleClick }),
      ...(this.onEventRightClick !== undefined && { onEventRightClick: this.onEventRightClick }),
      ...(this.onEventMiddleClick !== undefined && { onEventMiddleClick: this.onEventMiddleClick }),
      ...(this.onEventSelect !== undefined && { onEventSelect: this.onEventSelect }),
      ...(this.onEventDrop !== undefined && { onEventDrop: this.onEventDrop }),
      ...(this.onEventResize !== undefined && { onEventResize: this.onEventResize }),
      ...(this.onDropFromOutside !== undefined && { onDropFromOutside: this.onDropFromOutside }),
      ...(this.onEventDragStart !== undefined && { onEventDragStart: this.onEventDragStart }),
      ...(this.onSlotSelecting !== undefined && { onSlotSelecting: this.onSlotSelecting }),
      ...(this.onSlotClick !== undefined && { onSlotClick: this.onSlotClick }),
      ...(this.onSlotDoubleClick !== undefined && { onSlotDoubleClick: this.onSlotDoubleClick }),
      ...(this.onSlotSelect !== undefined && { onSlotSelect: this.onSlotSelect }),
      ...(this.onRangeChange !== undefined && { onRangeChange: this.onRangeChange }),
      ...(this.onDrillDown !== undefined && { onDrillDown: this.onDrillDown }),
    }
  }

  override render() {
    const ids = this._controller?.descriptionIds
    const msgs = this._controller?.messages
    if (!ids || !msgs) return html``
    return html`
      <p id="${ids.selection}" class="bc-sr-only">${msgs.selectionInstructions}</p>
      <p id="${ids.event}" class="bc-sr-only">${msgs.eventInstructions}</p>
      <slot></slot>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-calendar': CalendarElement
  }
}
