<script lang="ts">
  import type { HTMLInputTypeAttribute } from "svelte/elements.js";

  export let name: string;
  export let type: Exclude<
    HTMLInputTypeAttribute,
    "button" | "checkbox" | "radio" | "submit" | "hidden" | "color" | "image" | "reset"
  >;
  export let label: string;
  export let placeholder = "";
  export let disabled: boolean = false;

  export let isControlValid = true;

  let ref: HTMLInputElement;

  $: showPlaceholder = ["text", "input", "email", "number", "tel", "password"].includes(type);
</script>

<div class="relative bg-inherit">
  <input
    bind:this={ref}
    class={`peer text-sm px-2 h-10 w-full outline-none border-2 border-neutral-400 text-neutral-900 rounded ${
      showPlaceholder ? "placeholder-transparent" : ""
    }
    focus:border-violet-400 focus:shadow-xs focus:shadow-violet-500
    invalid:border-red-600`}
    id={`${name}-input`}
    {name}
    {type}
    placeholder={placeholder ?? label}
    on:blur={() => (isControlValid = ref.validity.valid)}
    {disabled}
    {...$$props}
  />
  {#if label && showPlaceholder}
    <label
      class="absolute z-10 inline-block cursor-text transition-all bg-white
      left-2 -top-2 text-neutral-700 text-xs
      px-2
      peer-placeholder-shown:top-2.5
      peer-placeholder-shown:text-sm
      peer-focus:-top-2 peer-focus:text-xs"
      for={`${name}-input`}
      id={`${name}-label`}>{label}</label
    >
  {/if}
</div>
