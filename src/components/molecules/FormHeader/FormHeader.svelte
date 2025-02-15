<script lang="ts">
  export let formTitle: string | undefined = undefined;
  export let subtitle: string | undefined = undefined;
  $: showHeader = formTitle || subtitle;
</script>

{#if showHeader}
  <div class="mb-8 flex flex-col items-center gap-1 text-center">
    {#if formTitle}
      <h1 class="text-[2rem] font-light uppercase leading-7 text-sky-800">{formTitle}</h1>
      {#if subtitle}
        <span class="text-sm font-normal text-sky-800">{subtitle}</span>
      {/if}
    {/if}
  </div>
{/if}
