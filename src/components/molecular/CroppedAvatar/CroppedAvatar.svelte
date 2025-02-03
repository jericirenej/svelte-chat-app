<script lang="ts">
  import { IMAGE_CROP } from "../../../messages";
  import type { Maybe } from "../../../types";
  import Avatar from "../../atomic/Avatar/Avatar.svelte";
  import ErrorBlock from "./ErrorBlock/ErrorBlock.svelte";
  export let src: string;
  export let sizeLimit: Maybe<number>;
  export let sizeLimitLabel: string;
  export let modifyCb: () => void;
  export let deleteCb: () => void;
</script>

<div>
  <div class="flex gap-2">
    <Avatar size={80} {src} name="profile" />
    <div class="flex flex-col items-start justify-around">
      <button
        class="inline-block rounded-md px-2 py-1 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 hover:bg-opacity-50"
        type="button"
        on:click={modifyCb}>{IMAGE_CROP.modify}</button
      >
      <button
        type="button"
        class="inline-block rounded-md px-2 py-1 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 hover:bg-opacity-50"
        on:click={deleteCb}>{IMAGE_CROP.remove}</button
      >
    </div>
  </div>
  <ErrorBlock {src} {sizeLimit} {sizeLimitLabel} />
</div>
