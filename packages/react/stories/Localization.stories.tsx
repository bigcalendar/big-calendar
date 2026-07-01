import type { Messages } from '@big-calendar/core'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar } from '../src'
import { CalendarStage } from './harness'

const meta: Meta = {
  title: 'Calendar/Localization',
}
export default meta

type Story = StoryObj<typeof meta>

// ─── Arabic RTL ───────────────────────────────────────────────────────────────

const arabicLocalizer = await createTemporalLocalizer({ locale: 'ar', timeZone: 'UTC' })

const arabicMessages: Partial<Messages> = {
  date: 'التاريخ',
  time: 'الوقت',
  event: 'الحدث',
  allDay: 'طوال اليوم',
  week: 'أسبوع',
  work_week: 'أسبوع العمل',
  day: 'يوم',
  month: 'شهر',
  previous: 'السابق',
  next: 'التالي',
  yesterday: 'أمس',
  tomorrow: 'غدًا',
  today: 'اليوم',
  agenda: 'جدول أعمال',
  noEventsInRange: 'لا توجد أحداث في هذا النطاق.',
  showMore: (total) => `+${total} المزيد`,
}

/**
 * Arabic locale with right-to-left layout. The entire grid — toolbar, day
 * headings, time gutter, event blocks — flips because Big Calendar uses CSS
 * logical properties and the `:dir()` pseudo-class throughout. No `rtl` prop
 * is required; setting `dir="rtl"` on the container activates the layout.
 *
 * The `messages` override translates the visible toolbar labels and status
 * strings. Translate `selectionInstructions` and `eventInstructions` too in
 * a production app for full screen-reader coverage in Arabic.
 */
export const ArabicRTL: Story = {
  render: () => (
    <div dir={arabicLocalizer.direction} lang={arabicLocalizer.language} style={{ blockSize: '100dvh', inlineSize: '100%' }}>
      <CalendarStage localizer={arabicLocalizer} messages={arabicMessages} height="100%">
        <Calendar />
      </CalendarStage>
    </div>
  ),
}

// ─── Spanish Messages ─────────────────────────────────────────────────────────

const spanishLocalizer = await createTemporalLocalizer({ locale: 'es', timeZone: 'UTC' })

const spanishMessages: Partial<Messages> = {
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  allDay: 'Todo el día',
  week: 'Semana',
  work_week: 'Semana laboral',
  day: 'Día',
  month: 'Mes',
  previous: 'Anterior',
  next: 'Siguiente',
  yesterday: 'Ayer',
  tomorrow: 'Mañana',
  today: 'Hoy',
  agenda: 'Agenda',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: (total) => `+${total} más`,
  selectionInstructions:
    'Use las teclas de flecha para moverse entre franjas horarias. Mantenga pulsada Mayúsculas y una tecla de flecha para seleccionar un rango. Presione Intro o Espacio para confirmar, o Escape para cancelar.',
  eventInstructions:
    'Use las teclas de flecha para moverse entre eventos. Presione Intro para abrir un evento o F2 para su acción secundaria. Para reposicionar un evento, presione Espacio para recogerlo, luego las teclas de flecha para moverlo (mantenga Mayúsculas mientras presiona una tecla de flecha para redimensionar), Intro para soltar, o Escape para cancelar.',
}

/**
 * Spanish locale with all UI strings overridden via the `messages` prop.
 * Every toolbar button, view label, and status message is replaced — the
 * English defaults never render. The `showMore` key is a function so you can
 * match the plural rules of your target language.
 *
 * The screen-reader instruction strings (`selectionInstructions` and
 * `eventInstructions`) are also translated here for complete a11y coverage.
 */
export const SpanishMessages: Story = {
  render: () => (
    <CalendarStage localizer={spanishLocalizer} messages={spanishMessages}>
      <Calendar />
    </CalendarStage>
  ),
}
