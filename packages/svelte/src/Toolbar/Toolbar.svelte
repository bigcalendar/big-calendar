<script lang="ts">
import type { Component } from 'svelte'
import { useCalendarContext } from '../CalendarProvider'
import DefaultToolbar from '../DefaultToolbar/DefaultToolbar.svelte'
import { useToolbarProps } from '../useToolbarProps'

const { components } = useCalendarContext()
const ToolbarComp = (components.toolbar ?? DefaultToolbar) as Component
const toolbarProps = useToolbarProps()
</script>

<svelte:component this={ToolbarComp} {...toolbarProps.current} />
