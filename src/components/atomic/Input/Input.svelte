<script lang="ts">
  import type { HTMLInputTypeAttribute } from "svelte/elements";


  export let name: string;
  export let type: Exclude<
    HTMLInputTypeAttribute,
    "button" | "checkbox" | "radio" | "submit" | "hidden" | "color" | "image" | "reset"
  >;
  export let label: string;
  export let placeholder = "";
  export let disabled: boolean = false;
  export let value: string | undefined;
  export let input: (ev?: Event) => unknown = () => {};

  export let isControlValid = true;

  let ref: HTMLInputElement;

  const typeAction = (node: HTMLInputElement) => {
    node.type = type;
  };

  $: showPlaceholder = ["text", "input", "email", "number", "tel", "password"].includes(type);
</script>

<div class="relative bg-inherit">
  <input
    bind:this={ref}
    class={`peer h-10 w-full rounded border-2 border-neutral-400 px-2 text-sm text-neutral-900 outline-none ${
      showPlaceholder ? "placeholder-transparent" : ""
    }
    focus:shadow-xs invalid:border-red-600 focus:border-violet-400
    focus:shadow-violet-500`}
    id={`${name}-input`}
    {name}
    use:typeAction
    bind:value
    placeholder={placeholder.length ? placeholder : label}
    on:blur={() => (isControlValid = ref.validity.valid)}
    on:input={input}
    {disabled}
    {...$$props}
  />
  {#if label && showPlaceholder}
    <label
      class="absolute -top-2 left-2 z-10
      inline-block cursor-text bg-white
      px-2 text-xs text-neutral-700 transition-all
      peer-placeholder-shown:top-2.5
      peer-placeholder-shown:text-sm
      peer-focus:-top-2 peer-focus:text-xs"
      for={`${name}-input`}
      id={`${name}-label`}>{label}</label
    >
  {/if}
</div>
