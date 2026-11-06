import {
  DocsContainer,
  type DocsContainerProps,
} from '@storybook/addon-docs/blocks'
import type { Preview } from '@storybook/react-vite'
import type { PropsWithChildren } from 'react'

/** Docs pages render inside `<main>`, so their content sits in a landmark (axe: landmark-one-main, region). */
function DocsPage(props: PropsWithChildren<DocsContainerProps>) {
  return (
    <main>
      <DocsContainer {...props} />
    </main>
  )
}
DocsPage.displayName = 'DocsPage'

const preview: Preview = {
  parameters: {
    docs: { container: DocsPage },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Tutorial',
          'How-to',
          'Reference',
          'Explanation',
        ],
      },
    },
  },
}

export default preview
