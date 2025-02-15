<script lang="ts">
  import { IMAGE_CROP } from "../../../messages";
  import type { Maybe } from "../../../types";
  import Avatar from "../../atoms/Avatar/Avatar.svelte";
  import { dataUrlToBlobHandler } from "../../organisms/AddAvatar/handlers";
  export let src: string;
  export let sizeLimit: Maybe<number>;
  export let sizeLimitLabel: string;
  export let updateBlob: (blob: Blob) => void;
  export let modifyCb: () => void;
  export let deleteCb: () => void;

  const emptyObj = (..._args: unknown[]) => ({});

  $: key = emptyObj(src, sizeLimit);

  const isCropOverSize = async () => {
    if (!sizeLimit) return false;
    const blob = await dataUrlToBlobHandler(src);
    updateBlob(blob);
    return blob.size > sizeLimit;
  };
</script>

<div class="cropped-avatar relative flex w-fit">
  <div class="absolute -right-6 top-0 flex flex-col gap-2">
    <button
      type="button"
      class="flex h-7 items-center rounded-md bg-neutral-700 pl-9 pr-2 text-sm font-semibold leading-[0] text-white"
      title={IMAGE_CROP.remove}
      on:click={deleteCb}>x</button
    >
    {#key key}
      {#await isCropOverSize() then isOverSize}
        {#if isOverSize}
          <p
            title={IMAGE_CROP.tooLarge(sizeLimitLabel)}
            class="flex h-7 items-center rounded-md bg-red-700 pl-9 pr-2 text-sm font-semibold leading-[0] text-white"
          >
            !
          </p>
        {/if}
      {/await}
    {/key}
  </div>

  <button
    type="button"
    on:click={modifyCb}
    title={IMAGE_CROP.modify}
    class="relative z-10 cursor-zoom-in"
  >
    <Avatar size={100} {src} name="Your profile picture" />
  </button>
</div>
