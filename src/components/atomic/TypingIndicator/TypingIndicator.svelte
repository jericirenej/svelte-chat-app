<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import type { Nullish } from "../../../types";
  import AnimatedDots from "../AnimatedDots/AnimatedDots.svelte";

  export let usersTyping: string | Nullish = undefined;
</script>

{#if usersTyping?.length}
  <div
    in:scale={{ duration: 150 }}
    out:fade={{ duration: 70 }}
    class="typing-indicator flex w-fit items-baseline rounded-lg bg-slate-200 px-2 py-1"
  >
    <span class="text-xs font-medium text-gray-600">{usersTyping}</span>
    <AnimatedDots />
  </div>
{/if}
