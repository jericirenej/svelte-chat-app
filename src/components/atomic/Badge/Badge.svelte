<script lang="ts">
  import { quintOut } from "svelte/easing";
  import { scale } from "svelte/transition";
  import type { ActionTypes } from "../../../types";

  export let status: ActionTypes = "confirm";
  export let num: number;
  export let label: string;
  const statusToColor: Record<ActionTypes, string> = {
    cancel: "bg-slate-500",
    confirm: "bg-emerald-600",
    info: "bg-violet-600",
    danger: "bg-red-600"
  };

  $: prefix = num.toString().length > 2 ? "+" : "";
  $: truncatedNum = num > 99 ? 99 : num;
</script>

{#if num > 0}
  {#key num}
    <div
      in:scale={{ duration: 500, start: 1.2, easing: quintOut, opacity: 1 }}
      class={`${statusToColor[status]} flex aspect-square w-fit min-w-[3ch] max-w-[10ch] cursor-default items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full  p-2 text-xs text-white`}
      title={label}
    >
      <span>{prefix}{truncatedNum}</span>
    </div>
  {/key}
{/if}
