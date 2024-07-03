<script lang="ts">
  export let labelCallback: (() => unknown) | undefined = undefined;
  export let label: string;
</script>

<fieldset
  class="flex
min-h-[125px] w-[270px] flex-row items-center
gap-x-5
rounded
border-2
border-stone-300
px-4
py-3
"
>
  <legend class="select-none">
    {#if labelCallback}
      <button
        class="rounded-md border px-2 text-xs uppercase tracking-wide transition-colors hover:bg-neutral-100"
        on:click={labelCallback}>{label}</button
      >
    {:else}
      <span class="rounded-md border px-2 text-xs uppercase tracking-wide">{label}</span>
    {/if}
  </legend>
  <slot />
</fieldset>
