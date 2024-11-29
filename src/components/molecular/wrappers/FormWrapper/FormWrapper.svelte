<script lang="ts">
  import { fade } from "svelte/transition";
  import FormHeader from "../../FormHeader/FormHeader.svelte";

  export let formTitle: string | undefined = undefined;
  export let subtitle: string | undefined = undefined;
</script>

<div class="m-auto mt-[15vh] flex flex-col items-center justify-center" in:fade={{ duration: 100 }}>
  <FormHeader {formTitle} {subtitle} />
  <div>
    <slot name="form" />
  </div>
  {#if $$slots.footer}
    <div class="mt-10">
      <slot name="footer" />
    </div>
  {/if}
</div>
