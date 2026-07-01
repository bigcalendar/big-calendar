import { z } from 'zod'

export const BC_MD_FILENAME = 'bc.md'

/**
 * Accessor field mapping: each key is a BC accessor name, the value is the
 * property name on the developer's event/resource data object.
 */
export const AccessorsSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  tooltip: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.string().optional(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  resourceTitle: z.string().optional(),
  type: z.string().optional(),
  resourceType: z.string().optional(),
  draggable: z.string().optional(),
  resizable: z.string().optional(),
})

/** Structured frontmatter stored in the YAML block at the top of bc.md. */
export const BcMdFrontmatterSchema = z.object({
  /** Semver of @big-calendar/react in use. */
  version: z.string().optional(),
  /** Enabled calendar views, e.g. ['month', 'week', 'day', 'agenda']. */
  views: z.array(z.string()).optional(),
  /** Enabled feature flags, e.g. ['dnd', 'selection', 'resources']. */
  features: z.array(z.string()).optional(),
  /** Field-name mapping from BC accessor names to the app's event shape. */
  accessors: AccessorsSchema.optional(),
})

export type BcMdFrontmatter = z.infer<typeof BcMdFrontmatterSchema>
export type AccessorsMap = z.infer<typeof AccessorsSchema>

/** Parsed bc.md: typed frontmatter + free-form prose body. */
export interface BcMd {
  frontmatter: BcMdFrontmatter
  /** Free-form app context below the frontmatter block. */
  content: string
}
