<script lang="ts">
  import { AVATAR } from "../../../constants";
  import { UPLOAD_ERROR } from "../../../messages";
  import type { Maybe } from "../../../types";
  export let label: string;
  export let title: Maybe<string>;
  export let accept: string;
  export let errMessage: Maybe<string> = undefined;
  export let isError = false;
  let fileInput: HTMLInputElement;
</script>

<div class="relative w-fit">
  <button
    class="aspect-square w-[100px] border-2 border-neutral-600 text-xs text-neutral-800 transition-colors hover:bg-neutral-100"
    type="button"
    style:border-radius={AVATAR.borderRadius}
    {title}
    on:click={() => {
      isError = false;
      fileInput.click();
    }}>{label}</button
  >
  {#if isError}
    <small
      class="absolute left-[110%] top-0 flex h-full w-[15ch] select-none text-center text-xs text-red-600"
      >{errMessage?.length ? errMessage : UPLOAD_ERROR}</small
    >
  {/if}
  <input bind:this={fileInput} type="file" hidden={true} {accept} on:change />
</div>

<style lang="css">
  small {
    opacity: 0;
    animation: appear 300ms ease-out forwards;
  }
  @keyframes appear {
    to {
      opacity: 1;
    }
  }
</style>
