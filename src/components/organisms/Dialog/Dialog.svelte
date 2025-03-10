<script lang="ts">
  import { onMount } from "svelte";
  import Button from "../../atoms/Button/Button.svelte";

  export let open = false;
  export let message: string | undefined = undefined;
  export let heading: string | undefined = undefined;
  export let confirmMessage: string | undefined = undefined;
  export let rejectMessage: string | undefined = undefined;

  export let confirmAction: () => unknown = () => {};

  let ref: HTMLDialogElement | undefined;

  const showModal = (open: boolean) => {
    if (!ref) return;
    if (open) {
      ref.showModal();
      return;
    }
    ref.close();
  };

  const handleClick = (val: boolean) => {
    if (val) confirmAction();
    open = false;
  };

  $: showModal(open);

  onMount(() => {
    showModal(open);
  });
</script>

<dialog
  bind:this={ref}
  class="max-w-prose scale-75 rounded-md from-blue-100 to-blue-200 opacity-50 shadow transition-all duration-150 backdrop:bg-gradient-to-bl backdrop:opacity-40 [&.open]:scale-100 [&.open]:opacity-100"
  class:open
  on:close
  on:close={() => {
    open = false;
  }}
>
  <div class="mt-2 px-8 py-4">
    {#if heading}
      <h1 class="mb-3 text-center text-lg font-semibold">{heading}</h1>
    {/if}
    <article class="mb-5 mt-2">
      <slot
        >{#if message}<p>{message}</p>{/if}</slot
      >
    </article>
    <div class="mb-2 mt-3 flex justify-center gap-3">
      <Button
        action="danger"
        size="sm"
        on:click={() => {
          handleClick(true);
        }}>{confirmMessage ? confirmMessage : "Yes"}</Button
      >
      {#if open}
        <Button
          focus={true}
          action="cancel"
          size="sm"
          on:click={() => {
            handleClick(false);
          }}>{rejectMessage ? rejectMessage : "No"}</Button
        >
      {/if}
    </div>
  </div>
</dialog>

<style>
  .shadow {
    box-shadow: rgba(239, 68, 68, 0.2) 0px 0px 10px 2px;
  }
</style>
