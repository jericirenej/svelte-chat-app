<script lang="ts">
  import { onMount } from "svelte";
  import { CLOSE } from "../../../messages";
  import DeleteButton from "../../atomic/DeleteButton/DeleteButton.svelte";
  let ref: HTMLDialogElement;
  export let showClose = false;

  const close = () => {
    ref.close();
  };

  onMount(() => {
    ref.showModal();
  });
</script>

<dialog
  bind:this={ref}
  on:close
  class="flex flex-col items-center bg-transparent backdrop:bg-black backdrop:opacity-75"
>
  {#if showClose}
    <div class="flex w-full justify-end bg-transparent">
      <DeleteButton
        color="hsl(0deg, 0%, 100%)"
        label={CLOSE}
        on:click={close}
        on:pointerdown={close}
      />
    </div>
  {/if}
  <div class="w-full">
    <slot />
  </div>
</dialog>
