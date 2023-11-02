<script lang="ts">
  import type { HTMLInputTypeAttribute } from "svelte/elements.js";

  export let name: string;
  export let type: HTMLInputTypeAttribute;
  export let label: string;
  export let placeholder: string;
  export let disabled: boolean = false;
</script>

<div class="relative bg-inherit">
  <input
    class="peer text-sm px-2 h-10 w-full outline-none border-2 border-neutral-400 text-neutral-900 rounded placeholder-transparent
    focus:border-violet-400 focus:shadow-xs focus:shadow-violet-500
    invalid:border-red-600"
    id={`${name}-input`}
    {name}
    {type}
    placeholder={placeholder ?? label}
    {disabled}
    {...$$props}
  />
  {#if label}
    <label
      class="absolute z-10 inline-block cursor-text transition-all bg-white
      left-2 -top-2 text-neutral-600 text-xs
      px-2
      peer-placeholder-shown:top-2.5
      peer-placeholder-shown:text-sm
      peer-focus:-top-2 peer-focus:text-xs"
      for={`${name}-input`}
      id={`${name}-label`}>{label}</label
    >
  {/if}
</div>
