<script lang="ts">
  import { debounce } from "$lib/utils";
  import Input from "../../atomic/Input/Input.svelte";

  export let searchCb: (val: string) => unknown;
  export const clear = () => {
    search = "";
  };
  export let label: string;
  export let name: string;
  export let placeholder: string | undefined;

  export let search = "";

  const handleInput = debounce(() => searchCb(search), 100);
</script>

<div class="relative flex flex-col">
  <Input
    input={handleInput}
    type="search"
    {name}
    {label}
    {placeholder}
    bind:value={search}
    on:blur
    on:focus
    {...$$restProps}
  />
  <slot />
</div>
