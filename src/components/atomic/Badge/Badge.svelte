<script lang="ts">
  import { quintOut } from "svelte/easing";
  import { scale } from "svelte/transition";
  import type { ActionTypes } from "../../../types";

  export let status: ActionTypes = "confirm";
  export let num: number;
  export let label: string;
  const statusToColor: Record<ActionTypes, string> = {
    cancel: "border-slate-500 text-slate-500",
    confirm: "border-emerald-600 text-emerald-600",
    info: "border-violet-600 text-violet-600",
    danger: "border-red-600 text-red-600"
  };

  $: prefix = num.toString().length > 2 ? "+" : "";
  $: truncatedNum = num > 99 ? 99 : num;
</script>

{#if num > 0}
  <div>
    {#key num}
      <span
        in:scale={{ duration: 500, start: 1.2, easing: quintOut, opacity: 1 }}
        class={`${statusToColor[status]} block cursor-default rounded-md border-2 px-2 text-xs`}
        title={label}
      >
        {prefix}{truncatedNum}
      </span>
    {/key}
  </div>
{/if}
