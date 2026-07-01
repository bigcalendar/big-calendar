<script lang="ts">
import type { Component } from 'svelte'
import AgendaView from '../AgendaView/AgendaView.svelte'
import { useCalendarContext } from '../CalendarProvider'
import { fromSignal } from '../internal/fromSignal.svelte'
import MonthView from '../MonthView/MonthView.svelte'
import TimeGridView from '../TimeGridView/TimeGridView.svelte'
import Toolbar from '../Toolbar/Toolbar.svelte'

let { toolbar = true }: { toolbar?: boolean } = $props()

const { store, components } = useCalendarContext()
const viewModelSignal = fromSignal(store.viewModel)

const viewModel = $derived(viewModelSignal.current)

const overrideView = $derived<Component | null>(
  (components.views?.[viewModel.view] as Component | undefined) ?? null,
)

const overrideModel = $derived<unknown>(() => {
  const vm = viewModel
  if (vm.kind === 'month') return vm.month
  if (vm.kind === 'time') return vm.timeGrid
  if (vm.kind === 'agenda') return vm.agenda
  return (vm as unknown as { model?: unknown }).model ?? null
})
</script>

{#if toolbar}
  <Toolbar />
{/if}
<div class="bc-calendar">
  {#if overrideView !== null}
    <svelte:component this={overrideView} view={viewModel.view} model={overrideModel} />
  {:else if viewModel.kind === 'month'}
    <MonthView />
  {:else if viewModel.kind === 'time'}
    <TimeGridView />
  {:else if viewModel.kind === 'agenda'}
    <AgendaView />
  {/if}
</div>
