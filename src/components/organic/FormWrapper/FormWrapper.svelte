<script lang="ts">
  export let formTitle: string | undefined = undefined;
  export let subtitle: string | undefined = undefined;

  $: showHeader = formTitle || subtitle;
</script>

<div
  class="absolute left-1/2 top-[30%] flex -translate-x-1/2 -translate-y-[30%] flex-col items-center justify-center"
>
  {#if showHeader}
    <div class="mb-8 flex flex-col items-center gap-1">
      {#if formTitle}
        <h1 class="text-[2rem] font-light uppercase leading-7 text-sky-800">{formTitle}</h1>
        {#if subtitle}
          <span class="text-sm font-normal text-sky-800">{subtitle}</span>
        {/if}
      {/if}
    </div>
  {/if}
  <div>
    <slot name="form" />
  </div>
  {#if $$slots.footer}
    <div class="mt-10">
      <slot name="footer" />
    </div>
  {/if}
</div>
