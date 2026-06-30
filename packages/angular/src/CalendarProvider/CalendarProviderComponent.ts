import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core'
import type { EffectRef, Signal } from '@angular/core'
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
  ResourceId,
  ResourceLayoutMode,
  SelectableMode,
  SlotSelectionDates,
  PlainTimeInput,
  ViewKey,
  ViewRegistry,
} from '@big-calendar/core'
import { CALENDAR_TOKEN } from './calendarContext'
import type { CalendarComponents } from './calendarContext'

let _nextId = 0

/**
 * Angular standalone provider component that owns the calendar store lifecycle.
 * Wraps any descendant tree that needs calendar state.
 *
 * Provides itself as `CALENDAR_TOKEN` so descendants can call `injectCalendar()`
 * to access the shared store, resolved messages, and description IDs.
 *
 * All `CalendarProps` fields are exposed as Angular signal inputs with the same
 * names as the React and Vue adapters for API parity. The store is created on
 * the first effect run (after inputs are set) and destroyed when the component
 * is torn down.
 *
 * @example
 * ```html
 * <bc-calendar-provider
 *   [localizer]="localizer"
 *   [defaultView]="'week'"
 *   [events]="events()"
 * >
 *   <bc-calendar />
 * </bc-calendar-provider>
 * ```
 */
@Component({
  selector: 'bc-calendar-provider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: CALENDAR_TOKEN,
      useExisting: forwardRef(() => CalendarProviderComponent),
    },
  ],
  template: `
    <p [id]="descriptionIds.selection" class="bc-sr-only">{{ messages.selectionInstructions }}</p>
    <p [id]="descriptionIds.event" class="bc-sr-only">{{ messages.eventInstructions }}</p>
    <ng-content />
  `,
})
export class CalendarProviderComponent {
  // ---- Required data inputs -------------------------------------------

  /** The localizer that drives all date math. Required. */
  readonly localizer = input.required<LocalizerContract>()

  // ---- Data inputs -------------------------------------------------------

  readonly events = input<unknown[] | undefined>()
  readonly backgroundEvents = input<unknown[] | undefined>()
  readonly resources = input<unknown[] | undefined>()

  // ---- View control ------------------------------------------------------

  /** Initial view when running uncontrolled. Ignored when `view` is set. */
  readonly defaultView = input<ViewKey | undefined>()
  /** Initial focus date when running uncontrolled. Ignored when `date` is set. */
  readonly defaultDate = input<string | undefined>()
  /** Controlled view. */
  readonly view = input<ViewKey | undefined>()
  /** Controlled focus date (RFC 3339/9557). */
  readonly date = input<string | undefined>()
  /** Which view keys the toolbar exposes. Defaults to all built-in views. */
  readonly views = input<ViewKey[] | undefined>()

  // ---- Static config -----------------------------------------------------

  readonly viewDefinitions = input<ViewRegistry<unknown, unknown> | undefined>()
  readonly accessors = input<Partial<Accessors<unknown, unknown>> | undefined>()
  readonly getNow = input<(() => string) | undefined>()
  readonly length = input<number | undefined>()
  readonly step = input<number | undefined>()
  readonly timeslots = input<number | undefined>()
  readonly min = input<PlainTimeInput | undefined>()
  readonly max = input<PlainTimeInput | undefined>()
  readonly scrollToTime = input<PlainTimeInput | undefined>()
  readonly dayLayoutAlgorithm = input<DayLayoutAlgorithmKey | DayLayoutAlgorithm | undefined>()
  readonly weekEventLimit = input<number | undefined>()
  readonly showMultiDayTimes = input<boolean | undefined>()
  readonly resourceLayout = input<ResourceLayoutMode | undefined>()
  readonly showAllEvents = input<boolean | undefined>()
  readonly selectable = input<SelectableMode | undefined>()
  readonly longPressThreshold = input<number | undefined>()
  readonly drilldownView = input<ViewKey | null | undefined>()
  readonly getDrilldownView = input<GetDrilldownView | undefined>()

  // ---- Callback inputs ---------------------------------------------------

  readonly onNavigate = input<((args: { date: string; view: ViewKey }) => void) | undefined>()
  readonly onView = input<((args: { view: ViewKey }) => void) | undefined>()
  readonly onEventClick = input<
    ((event: unknown, domEvent: MouseEvent | KeyboardEvent) => void) | undefined
  >()
  readonly onEventDoubleClick = input<
    ((event: unknown, domEvent: MouseEvent | KeyboardEvent) => void) | undefined
  >()
  readonly onEventRightClick = input<
    ((event: unknown, domEvent: MouseEvent) => void) | undefined
  >()
  readonly onEventMiddleClick = input<
    ((event: unknown, domEvent: MouseEvent) => void) | undefined
  >()
  readonly onEventSelect = input<
    ((args: { id: EventId | null }) => void) | undefined
  >()
  readonly onEventDrop = input<
    | ((args: {
        event: unknown
        start: string
        end: string
        allDay: boolean
        resourceId?: ResourceId | undefined
        backgroundEvents?: unknown[]
      }) => void)
    | undefined
  >()
  readonly onEventResize = input<
    | ((args: {
        event: unknown
        start: string
        end: string
        allDay: boolean
        resourceId?: ResourceId | undefined
        backgroundEvents?: unknown[]
      }) => void)
    | undefined
  >()
  readonly onDropFromOutside = input<
    | ((args: {
        start: string
        end: string
        allDay: boolean
        resourceId?: ResourceId | undefined
        backgroundEvents?: unknown[]
      }) => void)
    | undefined
  >()
  readonly onEventDragStart = input<
    ((args: { event: unknown }) => void) | undefined
  >()
  readonly onSlotSelecting = input<
    | ((args: {
        start: string
        end: string
        allDay: boolean
        resourceId?: ResourceId
        backgroundEvents?: unknown[]
      }) => boolean | void)
    | undefined
  >()
  readonly onSlotClick = input<
    ((selection: SlotSelectionDates<unknown>) => void) | undefined
  >()
  readonly onSlotDoubleClick = input<
    ((selection: SlotSelectionDates<unknown>) => void) | undefined
  >()
  readonly onSlotSelect = input<
    ((selection: SlotSelectionDates<unknown>) => void) | undefined
  >()
  readonly onRangeChange = input<
    | ((args: { range: { start: string; end: string }; view: ViewKey }) => void)
    | undefined
  >()
  readonly onDrillDown = input<
    ((args: { date: string; view: ViewKey }) => void) | undefined
  >()

  // ---- Provider-specific inputs (aliased to avoid getter name conflicts) --

  /** Per-slot component overrides (Task 11-5). Passed via `[components]="..."`. */
  readonly _components = input<CalendarComponents | undefined>(undefined, { alias: 'components' })
  /** UI string overrides merged over English defaults. Passed via `[messages]="..."`. */
  readonly _messages = input<Partial<Messages> | undefined>(undefined, { alias: 'messages' })

  // ---- Internal state ---------------------------------------------------

  private _store: CalendarStore<unknown, unknown> | null = null
  private readonly _storeSignal = signal<CalendarStore<unknown, unknown> | null>(null)
  private readonly _id = `bc-cp-${++_nextId}-`

  /**
   * Stable per-instance IDs for the two visually-hidden instruction elements.
   * Descendants point `aria-describedby` at these IDs.
   */
  readonly descriptionIds = {
    selection: `${this._id}selection`,
    event: `${this._id}event`,
  }

  constructor() {
    const destroyRef = inject(DestroyRef)
    let effectRef: EffectRef | null = null

    // Store creation is deferred to the first effect run so that
    // input.required<LocalizerContract>() is available (inputs are set by
    // Angular before effects run, but before the constructor returns).
    effectRef = effect(() => {
      const localizer = this.localizer()

      if (!this._store) {
        // First run — all inputs are set; create the store.
        const p = this._readInputs()
        this._store = createCalendarStore({
          localizer,
          events: p.events ?? [],
          backgroundEvents: p.backgroundEvents ?? [],
          resources: p.resources,
          view: p.view ?? p.defaultView,
          date: p.date ?? p.defaultDate,
          enabledViews: p.views,
          viewDefinitions: p.viewDefinitions,
          accessors: p.accessors,
          getNow: p.getNow,
          length: p.length,
          step: p.step,
          timeslots: p.timeslots,
          min: p.min,
          max: p.max,
          scrollToTime: p.scrollToTime,
          dayLayoutAlgorithm: p.dayLayoutAlgorithm,
          weekEventLimit: p.weekEventLimit,
          showMultiDayTimes: p.showMultiDayTimes,
          resourceLayout: p.resourceLayout,
          showAllEvents: p.showAllEvents,
          selectable: p.selectable,
          longPressThreshold: p.longPressThreshold,
          drilldownView: p.drilldownView,
          getDrilldownView: p.getDrilldownView,
          // All wrappers are created unconditionally so the store always has them,
          // regardless of when Angular sets the signal inputs (avoids a race where
          // Storybook/args arrive after the first effect run and callbacks would be
          // permanently absent). Each wrapper reads the LATEST signal value at call
          // time via optional chaining — a no-op when no handler is configured.
          onNavigate: (args) => this.onNavigate()?.(args),
          onView: (args) => this.onView()?.(args),
          onEventSelect: (args) => this.onEventSelect()?.(args),
          onDrillDown: (args) => this.onDrillDown()?.(args),
          onEventClick: (e, de) => this.onEventClick()?.(e, de),
          onEventDoubleClick: (e, de) => this.onEventDoubleClick()?.(e, de),
          onEventRightClick: (e, de) => this.onEventRightClick()?.(e, de),
          onEventMiddleClick: (e, de) => this.onEventMiddleClick()?.(e, de),
          onEventDrop: (args) => this.onEventDrop()?.(args),
          onEventResize: (args) => this.onEventResize()?.(args),
          onDropFromOutside: (args) => this.onDropFromOutside()?.(args),
          onEventDragStart: (args) => this.onEventDragStart()?.(args),
          onSlotSelecting: (args) => this.onSlotSelecting()?.(args),
          onSlotClick: (args) => this.onSlotClick()?.(args),
          onSlotDoubleClick: (args) => this.onSlotDoubleClick()?.(args),
          onSlotSelect: (args) => this.onSlotSelect()?.(args),
          onRangeChange: (args) => this.onRangeChange()?.(args),
        })
        this._storeSignal.set(this._store)
      } else {
        // Subsequent runs — sync reactive props into the live store.
        const store = this._store
        const p = this._readInputs()
        if (p.view !== undefined) store.view.value = p.view
        if (p.date !== undefined) store.date.value = p.date
        store.setLocalizer({ localizer })
        store.dayLayoutAlgorithm.value = p.dayLayoutAlgorithm
        store.events.value = p.events ?? []
        store.backgroundEvents.value = p.backgroundEvents ?? []
        store.resources.value = p.resources
      }
    })

    destroyRef.onDestroy(() => {
      effectRef?.destroy()
      this._store?.destroy()
    })
  }

  // ---- CalendarContextValue implementation (structural typing) -----------

  get store(): CalendarStore<unknown, unknown> {
    // Accessed by descendants via injectCalendar(). The store is always set
    // before descendants can meaningfully read it: Angular effects run
    // top-down, so the parent's store-creation effect completes before any
    // child effect or template binding that reads store.* is evaluated.
    return this._store!
  }

  get storeSignal(): Signal<CalendarStore<unknown, unknown> | null> {
    return this._storeSignal.asReadonly()
  }

  get components(): CalendarComponents {
    return this._components() ?? {}
  }

  get messages(): Messages {
    return resolveMessages(this._messages())
  }

  // ---- Private helpers --------------------------------------------------

  /** Read every input signal in a single call, tracked by the calling effect. */
  private _readInputs() {
    return {
      localizer: this.localizer(),
      events: this.events(),
      backgroundEvents: this.backgroundEvents(),
      resources: this.resources(),
      view: this.view(),
      date: this.date(),
      defaultView: this.defaultView(),
      defaultDate: this.defaultDate(),
      views: this.views(),
      viewDefinitions: this.viewDefinitions(),
      accessors: this.accessors(),
      getNow: this.getNow(),
      length: this.length(),
      step: this.step(),
      timeslots: this.timeslots(),
      min: this.min(),
      max: this.max(),
      scrollToTime: this.scrollToTime(),
      dayLayoutAlgorithm: this.dayLayoutAlgorithm(),
      weekEventLimit: this.weekEventLimit(),
      showMultiDayTimes: this.showMultiDayTimes(),
      resourceLayout: this.resourceLayout(),
      showAllEvents: this.showAllEvents(),
      selectable: this.selectable(),
      longPressThreshold: this.longPressThreshold(),
      drilldownView: this.drilldownView(),
      getDrilldownView: this.getDrilldownView(),
      onNavigate: this.onNavigate(),
      onView: this.onView(),
      onEventClick: this.onEventClick(),
      onEventDoubleClick: this.onEventDoubleClick(),
      onEventRightClick: this.onEventRightClick(),
      onEventMiddleClick: this.onEventMiddleClick(),
      onEventSelect: this.onEventSelect(),
      onEventDrop: this.onEventDrop(),
      onEventResize: this.onEventResize(),
      onDropFromOutside: this.onDropFromOutside(),
      onEventDragStart: this.onEventDragStart(),
      onSlotSelecting: this.onSlotSelecting(),
      onSlotClick: this.onSlotClick(),
      onSlotDoubleClick: this.onSlotDoubleClick(),
      onSlotSelect: this.onSlotSelect(),
      onRangeChange: this.onRangeChange(),
      onDrillDown: this.onDrillDown(),
    }
  }
}
