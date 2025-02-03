<script lang="ts">
  import { IMAGE_CROP } from "../../../../messages";
  import type { Maybe } from "../../../../types";
  import { dataUrlToBlobHandler } from "../../../organic/AddAvatar/handlers";

  export let src: string;
  export let sizeLimit: Maybe<number>;
  export let sizeLimitLabel: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const emptyObj = (..._args: unknown[]) => ({});

  $: key = emptyObj(src, sizeLimit);

  const isCropOverSize = async () => {
    if (!sizeLimit) return false;
    const blob = await dataUrlToBlobHandler(src);
    console.log(blob.size, sizeLimit);
    return blob.size > sizeLimit;
  };
</script>

{#key key}
  {#await isCropOverSize() then isOverSize}
    {#if isOverSize}
      <small class="mt-1 text-red-600">{IMAGE_CROP.tooLarge(sizeLimitLabel)}</small>
    {/if}
  {/await}
{/key}
