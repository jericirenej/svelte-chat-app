<script lang="ts">
  import { fade } from "svelte/transition";
  import FormHeader from "../../FormHeader/FormHeader.svelte";

  export let formTitle: string | undefined = undefined;
  export let subtitle: string | undefined = undefined;

</script>

<div
  class="absolute left-1/2 top-[30%] flex -translate-x-1/2 -translate-y-[30%] flex-col items-center justify-center"
  in:fade
>
  <FormHeader {formTitle} {subtitle} />
  <div>
    <slot name="form" />
  </div>
  {#if $$slots.footer}
    <div class="mt-8">
      <slot name="footer" />
    </div>
  {/if}
</div>
